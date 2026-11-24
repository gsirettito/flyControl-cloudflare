import csv
import io
import json
import os
import requests

AIRPORT_CACHE_FILE = "airports_cache.json"
AIRPORT_CSV_FILE = "airports.csv"   # Archivo local
_airport_data = None

def _load_airport_data():
    global _airport_data
    if _airport_data is not None:
        return _airport_data

    # 1. Si ya existe el caché, cargarlo
    if os.path.exists(AIRPORT_CACHE_FILE):
        with open(AIRPORT_CACHE_FILE, "r", encoding="utf-8") as f:
            _airport_data = json.load(f)
            print(f"[Airports] Cargados {len(_airport_data)} aeropuertos desde caché")
            return _airport_data

    # 2. Intentar leer el archivo CSV local
    if os.path.exists(AIRPORT_CSV_FILE):
        print("[Airports] Leyendo archivo local airports.csv...")
        try:
            with open(AIRPORT_CSV_FILE, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                airport_dict = {}
                for row in reader:
                    iata = row.get('code')   # columna correcta
                    if iata:
                        name = row.get('name', '')
                        city = row.get('city', '')
                        country = row.get('country', '')
                        friendly = city if city else name
                        if not friendly:
                            friendly = iata
                        airport_dict[iata] = {
                            "iata": iata,
                            "name": name,
                            "city": city,
                            "country": country,
                            "friendly_name": friendly
                        }
                with open(AIRPORT_CACHE_FILE, "w", encoding="utf-8") as f:
                    json.dump(airport_dict, f, indent=2, ensure_ascii=False)
                _airport_data = airport_dict
                print(f"[Airports] Cargados {len(airport_dict)} aeropuertos desde CSV local")
                return airport_dict
        except Exception as e:
            print(f"Error leyendo airports.csv local: {e}")

    # 3. Si no hay local, descargar desde URL
    url = "https://raw.githubusercontent.com/lxndrblz/Airports/main/airports.csv"
    try:
        print("[Airports] Descargando desde URL remota...")
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        reader = csv.DictReader(io.StringIO(response.text))
        airport_dict = {}
        for row in reader:
            # Nota: en el CSV remoto las columnas pueden ser 'iata_code' y 'municipality'
            iata = row.get('iata_code') or row.get('code')
            if iata:
                name = row.get('name', '')
                city = row.get('municipality') or row.get('city', '')
                country = row.get('iso_country') or row.get('country', '')
                friendly = city if city else name
                if not friendly:
                    friendly = iata
                airport_dict[iata] = {
                    "iata": iata,
                    "name": name,
                    "city": city,
                    "country": country,
                    "friendly_name": friendly
                }
        with open(AIRPORT_CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(airport_dict, f, indent=2, ensure_ascii=False)
        _airport_data = airport_dict
        print(f"[Airports] Descargados y guardados {len(airport_dict)} aeropuertos")
        return airport_dict
    except Exception as e:
        print(f"Error descargando datos de aeropuertos: {e}")
        _airport_data = {}
        return {}

def get_friendly_name(iata_code: str, fallback_name: str = None) -> str:
    """Devuelve el nombre amigable (ciudad o nombre) de un aeropuerto por su código IATA."""
    if not iata_code:
        return fallback_name or iata_code
    data = _load_airport_data()
    airport = data.get(iata_code)
    if airport:
        return airport.get("friendly_name")
    return fallback_name or iata_code

def search_airports(query: str, limit: int = 10):
    """
    Busca aeropuertos cuyo código IATA, ciudad, nombre o país contengan el texto de la consulta.
    Retorna una lista de diccionarios con los detalles del aeropuerto.
    """
    if not query:
        return []
    query_lower = query.lower()
    results = []
    data = _load_airport_data()
    for iata, details in data.items():
        # Buscar en código IATA, nombre amigable (ciudad), nombre oficial y país
        if (query_lower in iata.lower() or
            query_lower in details.get('friendly_name', '').lower() or
            query_lower in details.get('name', '').lower() or
            query_lower in details.get('country', '').lower()):
            results.append({
                "iata": iata,
                "name": details.get('name'),
                "city": details.get('city'),
                "country": details.get('country'),
                "friendly_name": details.get('friendly_name')
            })
    
    # Ordenar: priorizar coincidencia exacta en código IATA, luego en nombre amigable, luego en país, luego alfabético
    results.sort(key=lambda x: (
        -int(x['iata'].lower() == query_lower),
        -int(x['friendly_name'].lower() == query_lower),
        -int(x['country'].lower() == query_lower) if x.get('country') else 0,
        x['friendly_name']
    ))
    return results[:limit]