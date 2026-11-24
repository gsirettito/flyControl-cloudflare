import json
import os
import threading
import csv
import io
import requests
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, Query, HTTPException
from pyflightdata import FlightData

# Importaciones para el nuevo endpoint con fli
from fli.models import Airport, PassengerInfo, SeatType, MaxStops, SortBy, FlightSearchFilters, FlightSegment
from fli.search import SearchFlights

# Mapeo de clases de cabina a nombres legibles
CABIN_CLASS_NAMES = {
    SeatType.ECONOMY: "Economy",
    SeatType.PREMIUM_ECONOMY: "Premium Economy",
    SeatType.BUSINESS: "Business",
    SeatType.FIRST: "First Class",
}

CACHE_FILE = "cache.json"
AIRPORT_CACHE_FILE = "airports_cache.json"
CACHE_LOCK = threading.Lock()

app = FastAPI(title="Flight Info API")

# ---------- Funciones para nombres amigables de aeropuertos ----------
def load_airport_data():
    if os.path.exists(AIRPORT_CACHE_FILE):
        with open(AIRPORT_CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    
    url = "https://raw.githubusercontent.com/lxndrblz/Airports/main/airports.csv"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        reader = csv.DictReader(io.StringIO(response.text))
        airport_map = {}
        for row in reader:
            iata = row.get('iata')
            city = row.get('city')
            name = row.get('name')
            if iata:
                airport_map[iata] = city if city else name
        with open(AIRPORT_CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(airport_map, f, indent=2)
        return airport_map
    except Exception as e:
        print(f"Error descargando datos de aeropuertos: {e}")
        return {}

AIRPORT_NAME_MAP = load_airport_data()

def get_friendly_name(iata_code: str) -> str:
    if not iata_code:
        return None
    return AIRPORT_NAME_MAP.get(iata_code, iata_code)

# ---------- Funciones originales ----------
def convert_timestamp_to_utc(ts: Optional[int]) -> Optional[str]:
    if ts:
        return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')
    return None

def calculate_duration(departure_ts: Optional[int], arrival_ts: Optional[int]) -> Optional[str]:
    if departure_ts and arrival_ts:
        diff = arrival_ts - departure_ts
        hours = diff // 3600
        minutes = (diff % 3600) // 60
        return f"{hours}h {minutes}m"
    return None

def extract_flight_info(flight_dict: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(flight_dict, dict):
        raise ValueError(f"Se esperaba un diccionario, se recibió {type(flight_dict)}")
        
    scheduled = flight_dict.get('time', {}).get('scheduled', {})
    origin_data = flight_dict.get('airport', {}).get('origin', {})
    dest_data = flight_dict.get('airport', {}).get('destination', {})
    other_time = flight_dict.get('time', {}).get('other', {})
    ident = flight_dict.get('identification', {}).get('number', {}).get('default')
    status = flight_dict.get('status', {}).get('text')
    aircraft_model = flight_dict.get('aircraft', {}).get('model', {}).get('code')

    origin_iata = None
    if isinstance(origin_data.get('code'), dict):
        origin_iata = origin_data['code'].get('iata')
    dest_iata = None
    if isinstance(dest_data.get('code'), dict):
        dest_iata = dest_data['code'].get('iata')

    origin_tz = origin_data.get('timezone')
    dest_tz = dest_data.get('timezone')
    origin_timezone = origin_tz.get('name') if isinstance(origin_tz, dict) else None
    destination_timezone = dest_tz.get('name') if isinstance(dest_tz, dict) else None

    departure_ts = scheduled.get('departure')
    arrival_ts = scheduled.get('arrival')
    duration = calculate_duration(departure_ts, arrival_ts)

    return {
        "flightNumber": ident,
        "airlineIata": None,
        "airlineName": None,
        "origin": origin_iata,
        "destination": dest_iata,
        "originName": origin_data.get('name'),
        "destinationName": dest_data.get('name'),
        "departureUtc": convert_timestamp_to_utc(departure_ts),
        "arrivalUtc": convert_timestamp_to_utc(arrival_ts),
        "departureLocal": f"{scheduled.get('departure_date')} {scheduled.get('departure_time')}" if scheduled.get('departure_date') else None,
        "arrivalLocal": f"{scheduled.get('arrival_date')} {scheduled.get('arrival_time')}" if scheduled.get('arrival_date') else None,
        "status": status,
        "aircraft": aircraft_model,
        "originTimezone": origin_timezone,
        "destinationTimezone": destination_timezone,
        "departureTimestamp": departure_ts,
        "arrivalTimestamp": arrival_ts,
        "eta": convert_timestamp_to_utc(arrival_ts),
        "duration": duration,
        "updatedTimestamp": other_time.get('updated'),
        "updatedDate": other_time.get('updated_date'),
        "updatedTime": other_time.get('updated_time'),
    }

def get_airline_from_flight_number(flight_number: str):
    try:
        from FlightRadarAPI import FlightRadar24API
        airline_code = ''.join([ch for ch in flight_number if not ch.isdigit()])
        if not airline_code:
            return None, None
        fr_api = FlightRadar24API()
        airlines = fr_api.get_airlines()
        for airline in airlines:
            if airline.get("IATA") == airline_code:
                return airline.get("IATA"), airline.get("Name")
        for airline in airlines:
            if airline.get("ICAO") == airline_code:
                return airline.get("IATA"), airline.get("Name")
    except Exception as e:
        print(f"Error obteniendo aerolínea: {e}")
    return None, None

# ---------------- Funciones de caché ----------------
def load_cache():
    if not os.path.exists(CACHE_FILE):
        return {}
    with open(CACHE_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_cache(cache):
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2)

def get_cache_key(flight_number: str, date_local: str) -> str:
    return f"{flight_number}_{date_local.replace('-', '')}"

def clean_cache_old_flights():
    with CACHE_LOCK:
        cache = load_cache()
        now = datetime.now(timezone.utc)
        to_delete = []
        for key, entry in cache.items():
            data_dict = entry.get('data', {})
            if isinstance(data_dict, dict):
                departure_utc_str = data_dict.get('departureUtc')
            else:
                departure_utc_str = None
            if departure_utc_str:
                try:
                    dep_time = datetime.fromisoformat(departure_utc_str.replace('Z', '+00:00'))
                    if dep_time < now:
                        to_delete.append(key)
                except:
                    pass
        if to_delete:
            for key in to_delete:
                del cache[key]
            save_cache(cache)
            print(f"[Cache] Eliminados {len(to_delete)} vuelos caducados")
        else:
            print("[Cache] No se eliminaron vuelos")

def periodic_cleanup(interval_minutes=15):
    clean_cache_old_flights()
    threading.Timer(interval_minutes * 60, periodic_cleanup, args=(interval_minutes,)).start()

threading.Timer(1, periodic_cleanup, args=(15,)).start()

# ---------------- Endpoint original (por número de vuelo) ----------------
@app.get("/flight")
def get_flight_info(
    flight_number: str = Query(..., description="Número de vuelo, ej: CM278"),
    date: str = Query(..., description="Fecha local de salida (YYYY-MM-DD), ej: 2026-06-16")
):
    cache_key = get_cache_key(flight_number, date)
    
    with CACHE_LOCK:
        cache = load_cache()
        if cache_key in cache:
            entry = cache[cache_key]
            response = entry["data"].copy()
            response["cachedAt"] = entry["lastUpdated"]
            return {"flights": [response]}

    try:
        f = FlightData()
        all_flights = f.get_history_by_flight_number(flight_number)
        if not all_flights:
            raise HTTPException(status_code=404, detail="Vuelo no encontrado")

        target_yyyymmdd = date.replace("-", "")
        selected_flight = None
        for flight in all_flights:
            try:
                dep_date = flight['time']['scheduled']['departure_date']
                if dep_date == target_yyyymmdd:
                    selected_flight = flight
                    break
            except (KeyError, TypeError):
                continue

        if not selected_flight:
            raise HTTPException(
                status_code=404,
                detail=f"No se encontró vuelo {flight_number} para la fecha {date}"
            )

        result = extract_flight_info(selected_flight)
        airline_iata, airline_name = get_airline_from_flight_number(flight_number)
        result["airlineIata"] = airline_iata
        result["airlineName"] = airline_name

        now_utc = datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')
        with CACHE_LOCK:
            cache = load_cache()
            cache[cache_key] = {
                "data": result,
                "lastUpdated": now_utc,
                "departureUtc": result.get("departureUtc")
            }
            save_cache(cache)

        return {"flights": [result]}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error interno: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

# ---------------- Nuevo endpoint: búsqueda por ruta con fli (todas las clases, agrupado) ----------------
@app.get("/flights-from-to-fli")
def get_flights_from_to_fli(
    origin: str = Query(..., description="Código IATA del aeropuerto de origen, ej: PTY"),
    destination: str = Query(..., description="Código IATA del aeropuerto de destino, ej: EZE"),
    date: str = Query(..., description="Fecha de salida (YYYY-MM-DD), ej: 2026-06-15"),
    currency: str = Query("USD", description="Moneda para los precios (USD, EUR, etc.)"),
    country: str = Query("US", description="Código de país para la localización"),
):
    cache_key = f"fli_{origin}_{destination}_{date}_{currency}_{country}"
    
    with CACHE_LOCK:
        cache = load_cache()
        if cache_key in cache:
            entry = cache[cache_key]
            response = entry["data"].copy()
            response["cachedAt"] = entry["lastUpdated"]
            return response

    try:
        origin_upper = origin.upper()
        destination_upper = destination.upper()
        
        if not hasattr(Airport, origin_upper):
            raise HTTPException(status_code=400, detail=f"Código de aeropuerto origen inválido: {origin_upper}")
        if not hasattr(Airport, destination_upper):
            raise HTTPException(status_code=400, detail=f"Código de aeropuerto destino inválido: {destination_upper}")
        
        origin_airport = getattr(Airport, origin_upper)
        destination_airport = getattr(Airport, destination_upper)
        
        cabin_classes = [SeatType.ECONOMY, SeatType.PREMIUM_ECONOMY, SeatType.BUSINESS, SeatType.FIRST]
        # Diccionario para acumular vuelos por clase
        flights_by_class: Dict[str, List[Dict]] = {name: [] for name in CABIN_CLASS_NAMES.values()}
        search = SearchFlights()
        
        for cabin in cabin_classes:
            class_name = CABIN_CLASS_NAMES.get(cabin, str(cabin))
            filters = FlightSearchFilters(
                passenger_info=PassengerInfo(adults=1),
                flight_segments=[
                    FlightSegment(
                        departure_airport=[[origin_airport, 0]],
                        arrival_airport=[[destination_airport, 0]],
                        travel_date=date,
                    )
                ],
                seat_type=cabin,
                stops=MaxStops.ANY,
                sort_by=SortBy.CHEAPEST,
            )
            
            try:
                flights = search.search(filters, currency=currency, country=country)
            except Exception as e:
                print(f"Error buscando clase {cabin}: {e}")
                continue
            
            if not flights or not isinstance(flights, list):
                print(f"No se encontraron vuelos válidos para la clase {class_name}")
                continue
            
            for flight in flights:
                if flight is None or not hasattr(flight, 'legs'):
                    continue
                
                legs = flight.legs if flight.legs is not None else []
                legs_data = []
                for leg in legs:
                    if leg is None:
                        continue
                    origin_code = leg.departure_airport.name if leg.departure_airport else None
                    dest_code = leg.arrival_airport.name if leg.arrival_airport else None
                    
                    leg_dict = {
                        "airline": leg.airline.value if leg.airline else None,
                        "airlineIata": leg.airline.name if leg.airline else None,
                        "flight_number": leg.flight_number,
                        "origin": origin_code,
                        "destination": dest_code,
                        "origin_name": get_friendly_name(origin_code),
                        "destination_name": get_friendly_name(dest_code),
                        "departure_datetime": leg.departure_datetime.isoformat() if leg.departure_datetime else None,
                        "arrival_datetime": leg.arrival_datetime.isoformat() if leg.arrival_datetime else None,
                        "duration_minutes": leg.duration,
                        "aircraft": leg.aircraft,
                        "legroom": leg.legroom,
                        "overnight": leg.overnight,
                        "co2_emissions_g": leg.co2_emissions_g,
                        "amenities": {
                            "wifi": leg.amenities.wifi if leg.amenities else None,
                            "power": leg.amenities.power if leg.amenities else None,
                            "usb_power": leg.amenities.usb_power if leg.amenities else None,
                            "in_seat_video": leg.amenities.in_seat_video if leg.amenities else None,
                            "on_demand_video": leg.amenities.on_demand_video if leg.amenities else None,
                        } if leg.amenities else None,
                        "operating_airline": leg.operating_airline.value if leg.operating_airline else None,
                        "operating_flight_number": leg.operating_flight_number,
                    }
                    legs_data.append(leg_dict)
                
                flight_data = {
                    "price": float(flight.price) if flight.price is not None else None,
                    "currency": flight.currency,
                    "total_duration_minutes": flight.duration,
                    "stops": flight.stops,
                    "legs": legs_data,
                }
                flights_by_class[class_name].append(flight_data)
        
        # Ordenar cada lista por precio (los None al final)
        for class_name in flights_by_class:
            flights_by_class[class_name].sort(key=lambda x: x["price"] if x["price"] is not None else float('inf'))
        
        # Verificar si hay al menos algún vuelo en alguna clase
        if all(len(v) == 0 for v in flights_by_class.values()):
            raise HTTPException(
                status_code=404,
                detail=f"No se encontraron vuelos de {origin} a {destination} para la fecha {date}"
            )
        
        now_utc = datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')
        response_data = {"flights_by_class": flights_by_class}
        with CACHE_LOCK:
            cache = load_cache()
            cache[cache_key] = {
                "data": response_data,
                "lastUpdated": now_utc,
            }
            save_cache(cache)
        
        return response_data
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error interno en /flights-from-to-fli: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

# ---------------- Endpoint para limpiar caché manualmente ----------------
@app.delete("/cache")
def clear_cache():
    with CACHE_LOCK:
        save_cache({})
    return {"status": "cache cleared"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)