import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const flightNumber = searchParams.get('flight_number');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    if (!flightNumber || !dateFrom || !dateTo) {
        return NextResponse.json({ error: 'Faltan parámetros (flight_number, date_from, date_to)' }, { status: 400 });
    }

    const apiUrl = `https://flight-api.noxcreation.dev/flight?flight_number=${flightNumber}&date=${dateFrom}`;
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
            'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
        }
    };

    try {
        const response = await fetch(apiUrl, options);
        const dataT = await response.text();
        if (dataT == '' || dataT == undefined) {
            return NextResponse.json({ error: 'No existen datos para ese número de vuelo.' }, { status: 400 });
        }
        const data = JSON.parse(dataT).flights;

        if (!response.ok || !data || !Array.isArray(data)) {
            console.error('Error de AeroDataBox:', data);
            return NextResponse.json({ error: 'Error al consultar la API de vuelos' }, { status: response.status });
        }

        if (data.length === 0) {
            return NextResponse.json({ error: `No se encontraron vuelos para ${flightNumber} entre ${dateFrom} y ${dateTo}` }, { status: 404 });
        }

        // Mapeo adaptado a la estructura real
        const flights = data.map((flight: any) => ({
            // Campos principales
            flightNumber: flight.flightNumber,
            airlineIata: flight.airlineIata,
            airlineName: flight.airlineName,
            origin: flight.origin,
            destination: flight.destination,
            originName: flight.originName,
            destinationName: flight.destinationName,
            departureUtc: flight.departureUtc,
            arrivalUtc: flight.arrivalUtc,
            departureLocal: flight.departureLocal,
            arrivalLocal: flight.arrivalLocal,
            status: flight.status,
            aircraft: flight.aircraft,

            // Campos adicionales (zonas horarias, timestamps, etc.)
            originTimezone: flight.originTimezone,
            destinationTimezone: flight.destinationTimezone,
            departureTimestamp: flight.departureTimestamp,
            arrivalTimestamp: flight.arrivalTimestamp,
            eta: flight.eta,
            duration: flight.duration,
            updatedTimestamp: flight.updatedTimestamp,
            updatedDate: flight.updatedDate,
            updatedTime: flight.updatedTime,
            cachedAt: flight.cachedAt,
        }));

        console.log("flights mapeados:", flights);
        return NextResponse.json({ flights });
    } catch (error) {
        console.error('Error interno en el proxy:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}