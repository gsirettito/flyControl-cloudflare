// app/api/airports/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    // 1. Obtener el parámetro de búsqueda 'q' de la URL
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q');

    // 2. Validar que el parámetro exista
    if (!query) {
        return NextResponse.json({ error: 'El parámetro "q" es obligatorio' }, { status: 400 });
    }

    // 3. Construir la URL de la API externa
    const externalApiUrl = `https://flight-api.noxcreation.dev/airports/search?q=${encodeURIComponent(query)}`;

    try {
        // 4. Realizar la petición a la API externa
        const response = await fetch(externalApiUrl);

        if (!response.ok) {
            // Si la API externa responde con un error, lo propagamos
            return NextResponse.json(
                { error: `Error en la API externa: ${response.status}` },
                { status: response.status }
            );
        }

        // 5. Obtener y devolver los datos al frontend
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error al consultar la API de aeropuertos:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}