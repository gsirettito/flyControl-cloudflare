from typing import Optional
from fastapi import FastAPI, Query, HTTPException
from pyflightdata import FlightData
from datetime import datetime, timezone
from cache import load_cache, save_cache, get_cache_key, CACHE_LOCK
from flight_utils import extract_flight_info, get_airline_from_flight_number
from fli_service import search_flights_by_route
from airport_names import search_airports

app = FastAPI(title="Flight Info API")

# ---------- Endpoint /flight (número de vuelo) ----------
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


# ---------- Endpoint /flights-from-to-fli (ruta, con filtro de clase) ----------
@app.get("/flights-from-to-fli")
def get_flights_from_to_fli(
    origin: str = Query(..., description="Código IATA del aeropuerto de origen, ej: PTY"),
    destination: str = Query(..., description="Código IATA del aeropuerto de destino, ej: EZE"),
    date: str = Query(..., description="Fecha de salida (YYYY-MM-DD), ej: 2026-06-15"),
    currency: str = Query("USD", description="Moneda para los precios (USD, EUR, etc.)"),
    country: str = Query("US", description="Código de país para la localización"),
    cabin_class: str = Query("Economy", description="Clase de cabina: Economy, Premium Economy, Business, First Class"),
    adults: int = Query(1, ge=1, le=9, description="Número de adultos (1-9)"),
    return_date: Optional[str] = Query(None, description="Fecha de regreso (YYYY-MM-DD) para vuelos de ida y vuelta")
):
    # Validar clase
    valid_classes = ["Economy", "Premium Economy", "Business", "First Class"]
    if cabin_class not in valid_classes:
        raise HTTPException(status_code=400, detail=f"Clase inválida. Permitidas: {', '.join(valid_classes)}")
    
    # Si se proporciona return_date, validar que sea posterior a date (opcional)
    if return_date and return_date < date:
        raise HTTPException(status_code=400, detail="La fecha de regreso debe ser posterior a la fecha de salida")
    
    # Clave de caché incluyendo adultos y return_date
    cache_key = f"fli_{origin}_{destination}_{date}_{currency}_{country}_{cabin_class}_{adults}_{return_date or 'oneway'}"
    
    with CACHE_LOCK:
        cache = load_cache()
        if cache_key in cache:
            entry = cache[cache_key]
            response = entry["data"].copy()
            response["cachedAt"] = entry["lastUpdated"]
            return response

    try:
        flights = search_flights_by_route(
            origin, destination, date, currency, country,
            cabin_class=cabin_class,
            adults=adults,
            return_date=return_date
        )
        
        if not flights:
            detail_msg = f"No se encontraron vuelos de {origin} a {destination} para la fecha {date}"
            if return_date:
                detail_msg += f" con regreso {return_date}"
            detail_msg += f" en clase {cabin_class}"
            raise HTTPException(status_code=404, detail=detail_msg)
        
        now_utc = datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')
        response_data = {"flights": flights}
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


# ---------- Búsqueda de aeropuertos ----------
@app.get("/airports/search")
def search_airports_endpoint(
    q: str = Query(..., min_length=1, description="Texto para buscar en nombre, ciudad o código IATA"),
    limit: int = Query(10, ge=1, le=50, description="Número máximo de resultados a devolver")
):
    """
    Busca aeropuertos por nombre, ciudad o código IATA.
    Devuelve una lista de los 10 aeropuertos más relevantes.
    """
    results = search_airports(q, limit)
    return {"query": q, "total": len(results), "results": results}

# ---------- Endpoint para limpiar caché ----------
@app.delete("/cache")
def clear_cache():
    with CACHE_LOCK:
        save_cache({})
    return {"status": "cache cleared"}