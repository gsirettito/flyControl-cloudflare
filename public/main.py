# python-api/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from curl_cffi import requests as cffi_requests
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/flight")
def get_flight(callsign: str):
    callsign = callsign.upper().strip()
    
    if callsign.startswith("CM") and callsign[2:].isdigit():
        callsign = "CMP" + callsign[2:]
        print(f"-> Convertido a código ICAO: {callsign}")
        
    print(f"Buscando vuelo {callsign}...")
    
    # Usamos curl_cffi para tener la misma huella SSL que Chrome
    session = cffi_requests.Session(impersonate="chrome")
    
    headers = {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.flightradar24.com/',
        'Origin': 'https://www.flightradar24.com'
    }
    
    flight_id = None
    lat = None
    lon = None
    alt = 0
    spd = 0
    icao24 = None
    
    # --- 1. Obtener posición actual e ID de vuelo usando el buscador ---
    try:
        print("Intentando FR24 Search API...")
        url_search = f"https://api.flightradar24.com/common/v1/search.json?query={callsign}"
        response = session.get(url_search, headers=headers, timeout=10)
        print(f"FR24 Search Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            # Imprimimos si encontró resultados para depurar
            print(f"Resultados encontrados en Search: {len(data.get('results', []))}")
            
            if data.get("results"):
                for flight in data["results"]:
                    # Filtramos solo los que tienen lat/lon (que están volando ahora mismo)
                    if flight.get("lat") and flight.get("lon") and flight.get("id"):
                        flight_id = flight.get("id")
                        icao24 = flight.get("aircraftId")
                        lat = float(flight.get("lat"))
                        lon = float(flight.get("lon"))
                        alt = float(flight.get("alt", 0) or 0)
                        spd = float(flight.get("spd", 0) or 0)
                        print(f"✅ Posición encontrada. Flight ID: {flight_id}")
                        break
            else:
                print("⚠️ FR24 Search respondió 200, pero no trajo resultados para este callsign.")
        else:
            print(f"❌ FR24 Search devolvió código: {response.status_code}")
    except Exception as e:
        print(f"FR24 Search falló: {e}")

    # --- 2. Obtener la ruta histórica usando el Flight ID ---
    trail = []
    if flight_id:
        print("\n" + "="*50)
        print("INICIO DEPURACIÓN RUTA HISTÓRICA")
        try:
            print(f"Obteniendo ruta histórica para Flight ID: {flight_id}...")
            url_details = f"https://data-cloud.flightradar24.com/zones/fcgi/flight_details?flight_id={flight_id}&page=1&limit=100"
            print(f"URL: {url_details}")
            
            details_resp = session.get(url_details, headers=headers, timeout=10)
            print(f"FR24 Details Status Code: {details_resp.status_code}")
            
            if details_resp.status_code == 200:
                details_data = details_resp.json()
                print(f"Claves recibidas en Details: {list(details_data.keys())}")
                
                if "trail" in details_data:
                    print(f"El 'trail' EXISTE. Puntos encontrados: {len(details_data['trail'])}")
                    if details_data["trail"]:
                        for point in details_data["trail"]:
                            p_lat = point.get("lat")
                            p_lon = point.get("lng")
                            if p_lat and p_lon:
                                trail.append([float(p_lat), float(p_lon)])
                        print(f"✅ Ruta procesada con {len(trail)} puntos.")
                    else:
                        print("⚠️ La propiedad 'trail' vino vacía []")
                else:
                    print("⚠️ La respuesta NO contiene 'trail'.")
                    print(f"Respuesta cruda (300 chars): {str(details_data)[:300]}")
            else:
                print(f"❌ FR24 Details NO respondió 200. Código: {details_resp.status_code}")
                print(f"Texto bloqueo: {details_resp.text[:300]}")
        except Exception as e:
            print(f"❌ Excepción FR24 Details: {e}")
        print("="*50 + "\n")

    # --- 3. Devolver respuesta ---
    if lat and lon:
        return {
            "states": [{
                "icao24": icao24 or "N/A",
                "callsign": callsign,
                "origin_country": "N/A",
                "longitude": float(lon),
                "latitude": float(lat),
                "altitude": alt,
                "velocity": spd
            }],
            "trail": trail
        }

    # --- Fallback ADS-B ---
    try:
        print("Intentando con ADS-B Exchange...")
        url_adsb = f"https://api.adsbexchange.com/v2/callsign/{callsign}/"
        response = session.get(url_adsb, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("ac") and len(data["ac"]) > 0:
                flight = data["ac"][0]
                print("✅ Encontrado en ADS-B Exchange!")
                return {
                    "states": [{
                        "icao24": flight.get("icao", "N/A"),
                        "callsign": flight.get("flight", callsign).strip(),
                        "origin_country": "N/A",
                        "longitude": float(flight.get("lon", 0)),
                        "latitude": float(flight.get("lat", 0)),
                        "altitude": float(flight.get("alt_baro", 0) if flight.get("alt_baro") else 0),
                        "velocity": float(flight.get("gs", 0) if flight.get("gs") else 0)
                    }],
                    "trail": []
                }
    except Exception as e:
        print(f"ADS-B Exchange falló: {e}")

    return {"states": [], "trail": []}

if __name__ == "__main__":
    print("Iniciando servidor en http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)