import json
import os
import threading
from datetime import datetime, timezone

CACHE_FILE = "cache.json"
CACHE_LOCK = threading.Lock()

def load_cache():
    if not os.path.exists(CACHE_FILE):
        return {}
    with open(CACHE_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_cache(cache):
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2)

def get_cache_key(flight_number: str, date_local: str) -> str:
    """Genera clave de caché para el endpoint /flight."""
    return f"{flight_number}_{date_local.replace('-', '')}"

def clean_cache_old_flights():
    """Elimina del caché vuelos cuya hora de salida (departureUtc) ya pasó."""
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
    """Ejecuta limpieza cada interval_minutes minutos."""
    clean_cache_old_flights()
    threading.Timer(interval_minutes * 60, periodic_cleanup, args=(interval_minutes,)).start()