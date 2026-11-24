from typing import List, Dict, Optional
from fli.models import Airport, PassengerInfo, SeatType, MaxStops, SortBy, FlightSearchFilters, FlightSegment
from fli.search import SearchFlights
from airport_names import get_friendly_name

# Mapeo de nombres de clase a SeatType
CABIN_CLASS_MAP = {
    "Economy": SeatType.ECONOMY,
    "Premium Economy": SeatType.PREMIUM_ECONOMY,
    "Business": SeatType.BUSINESS,
    "First Class": SeatType.FIRST,
}

def search_flights_by_route(
    origin: str,
    destination: str,
    date: str,
    currency: str,
    country: str,
    cabin_class: str = "Economy",
    adults: int = 1,
    return_date: Optional[str] = None
) -> List[Dict]:
    """
    Busca vuelos entre dos aeropuertos en una fecha específica para una clase de cabina.
    Si return_date es proporcionado, busca vuelos de ida y vuelta.
    Retorna una lista de vuelos (no agrupada por clases).
    """
    origin_upper = origin.upper()
    destination_upper = destination.upper()
    
    if not hasattr(Airport, origin_upper):
        raise ValueError(f"Código de aeropuerto origen inválido: {origin_upper}")
    if not hasattr(Airport, destination_upper):
        raise ValueError(f"Código de aeropuerto destino inválido: {destination_upper}")
    
    origin_airport = getattr(Airport, origin_upper)
    destination_airport = getattr(Airport, destination_upper)
    
    seat_type = CABIN_CLASS_MAP.get(cabin_class)
    if seat_type is None:
        raise ValueError(f"Clase de cabina inválida: {cabin_class}. Permitidas: {list(CABIN_CLASS_MAP.keys())}")
    
    # Construir segmentos de vuelo
    flight_segments = [
        FlightSegment(
            departure_airport=[[origin_airport, 0]],
            arrival_airport=[[destination_airport, 0]],
            travel_date=date,
        )
    ]
    # Si es ida y vuelta, agregar segmento de regreso
    if return_date:
        flight_segments.append(
            FlightSegment(
                departure_airport=[[destination_airport, 0]],
                arrival_airport=[[origin_airport, 0]],
                travel_date=return_date,
            )
        )
    
    filters = FlightSearchFilters(
        passenger_info=PassengerInfo(adults=adults),
        flight_segments=flight_segments,
        seat_type=seat_type,
        stops=MaxStops.ANY,
        sort_by=SortBy.CHEAPEST,
    )
    
    search = SearchFlights()
    try:
        flights = search.search(filters, currency=currency, country=country)
    except Exception as e:
        print(f"Error buscando clase {cabin_class}: {e}")
        return []
    
    if not flights or not isinstance(flights, list):
        return []
    
    result_flights = []
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
            origin_full_name = leg.departure_airport.value if leg.departure_airport else None
            dest_full_name = leg.arrival_airport.value if leg.arrival_airport else None
            
            leg_dict = {
                "airline": leg.airline.value if leg.airline else None,
                "airlineIata": leg.airline.name if leg.airline else None,
                "flight_number": leg.flight_number,
                "origin": origin_code,
                "destination": dest_code,
                "origin_name": get_friendly_name(origin_code, origin_full_name),
                "destination_name": get_friendly_name(dest_code, dest_full_name),
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
        result_flights.append(flight_data)
    
    result_flights.sort(key=lambda x: x["price"] if x["price"] is not None else float('inf'))
    return result_flights