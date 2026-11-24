import csv
import io
import json
import os
import requests
from config import AIRPORT_CACHE_FILE

def load_airport_data():
    """Carga mapa IATA → nombre amigable (ciudad o nombre del aeropuerto)."""
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