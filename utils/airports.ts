// utils/airports.ts
import airportData from '@/public/airports.json';

type AirportInfo = {
    icao: string;
    iata: string;
    name: string;
    city: string;
    country: string;
    tz: string;
};

// 1. Tipamos el JSON importado
const airports = airportData as Record<string, AirportInfo>;

// 2. Creamos mapas para búsquedas ultrarrápidas
const iataMap = new Map<string, AirportInfo>();
const icaoMap = new Map<string, AirportInfo>();

// 3. Poblamos los mapas al iniciar el servidor
Object.values(airports).forEach((airport) => {
    if (airport.iata && airport.iata.trim() !== '') {
        iataMap.set(airport.iata.toUpperCase(), airport);
    }
    if (airport.icao) {
        icaoMap.set(airport.icao.toUpperCase(), airport);
    }
});

/**
 * Busca un aeropuerto por su código IATA o ICAO.
 */
export function getAirportData(code: string): AirportInfo | null {
    if (!code) return null;
    const cleanCode = code.trim().toUpperCase();

    // Buscamos primero por IATA (es lo que usan las aerolíneas comerciales)
    const airport = iataMap.get(cleanCode) || icaoMap.get(cleanCode);

    return airport || null;
}