import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import fs from 'fs/promises';
import path from 'path';

let iataLookupCache: Record<string, { name: string, timezone: string, city: string }> | null = null;

async function getIataLookup() {
    if (iataLookupCache) return iataLookupCache;

    const filePath = path.join(process.cwd(), 'public', 'airports.json');
    const fileContent = process.env.FLYCONTROL_WORKERS === 'true' ? await (await (getCloudflareContext().env as unknown as {ASSETS: {fetch(request:Request):Promise<Response>}}).ASSETS.fetch(new Request('https://assets.local/airports.json'))).text() : await fs.readFile(filePath, 'utf-8');
    const rawAirports = JSON.parse(fileContent);

    const lookup: Record<string, any> = {};
    for (const key in rawAirports) {
        const airport = rawAirports[key];
        if (airport.iata && airport.iata.length === 3) {
            lookup[airport.iata] = {
                name: airport.name,
                timezone: airport.tz,
                city: airport.city
            };
        }
    }

    iataLookupCache = lookup;
    return iataLookupCache;
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        
        // 1. Búsqueda parcial para el Autocomplete (?q=PT)
        const q = searchParams.get('q')?.toUpperCase();

        if (q !== null && q !== undefined) {
            if (q.length < 1) return NextResponse.json([]);
            
            const lookup = await getIataLookup();
            const results: string[] = [];
            
            for (const iataCode in lookup) {
                // Busca solo si el código IATA comienza con lo escrito
                if (iataCode.startsWith(q)) {
                    const airport = lookup[iataCode];
                    // 🔥 Devolvemos un string simple: "PTY - Tocumen International Airport (Tocumen)"
                    results.push(`${iataCode} - ${airport.name} (${airport.city})`);
                }
                if (results.length >= 20) break; 
            }
            
            return NextResponse.json(results);
        }

        // 2. Búsqueda exacta para obtener zona horaria (?iata=PTY)
        const iata = searchParams.get('iata')?.toUpperCase();

        if (!iata || iata.length !== 3) {
            return NextResponse.json({ error: 'Código IATA inválido' }, { status: 400 });
        }

        const lookup = await getIataLookup();
        const airport = lookup[iata];

        if (airport) {
            return NextResponse.json(airport);
        } else {
            return NextResponse.json({ error: 'Aeropuerto no encontrado' }, { status: 404 });
        }
    } catch (error: any) {
        console.error('Error leyendo airports.json:', error);
        return NextResponse.json({ error: 'Error interno al leer los aeropuertos' }, { status: 500 });
    }
}