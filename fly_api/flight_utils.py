from datetime import datetime, timezone
from typing import Optional, Dict, Any

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
    """Extrae información de un vuelo obtenido con pyflightdata (endpoint /flight)."""
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
    """Obtiene IATA y nombre de la aerolínea usando FlightRadarAPI."""
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