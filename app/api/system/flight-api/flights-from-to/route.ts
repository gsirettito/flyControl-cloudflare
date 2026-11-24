// app/api/system/flight-api/flights-from-to/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { authenticateAndLimit } from '@/utils/api/authenticateAndLimit';

// Valores permitidos para la clase de vuelo
const ALLOWED_CABIN_CLASSES = ['Economy', 'PremiumEconomy', 'Business', 'First'];

export async function GET(req: NextRequest) {
    // 1. Verificar autenticación del usuario
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const authResult = await authenticateAndLimit(session.user.id);
    if (authResult instanceof NextResponse) return authResult;

    // 2. Obtener y validar los parámetros de la consulta
    const searchParams = req.nextUrl.searchParams;
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const date = searchParams.get('date');
    const returnDate = searchParams.get('return_date');
    const adults = searchParams.get('adults');
    const currency = searchParams.get('currency') || 'USD';
    const cabinClass = searchParams.get('cabin_class') || 'Economy';

    // Validaciones de campos obligatorios
    if (!origin || !destination || !date) {
        return NextResponse.json(
            { error: 'Faltan parámetros obligatorios: origin, destination, date' },
            { status: 400 }
        );
    }

    if (!adults || isNaN(parseInt(adults)) || parseInt(adults) < 1) {
        return NextResponse.json(
            { error: 'El número de adultos debe ser un número entero mayor o igual a 1' },
            { status: 400 }
        );
    }

    if (!ALLOWED_CABIN_CLASSES.includes(cabinClass)) {
        return NextResponse.json(
            { error: `Clase no válida. Permitidas: ${ALLOWED_CABIN_CLASSES.join(', ')}` },
            { status: 400 }
        );
    }

    // 3. Construir la URL de la API externa
    const externalApiUrl = new URL('https://flight-api.noxcreation.dev/flights-from-to-fli');
    externalApiUrl.searchParams.append('origin', origin);
    externalApiUrl.searchParams.append('destination', destination);
    externalApiUrl.searchParams.append('date', date);
    externalApiUrl.searchParams.append('adults', adults);
    externalApiUrl.searchParams.append('currency', currency);
    externalApiUrl.searchParams.append('cabin_class', cabinClass);
    if (returnDate) {
        externalApiUrl.searchParams.append('return_date', returnDate);
    }

    console.log(`[Flights API] Consultando: ${externalApiUrl.toString()}`);

    try {
        // 4. Realizar la petición a la API externa
        const response = await fetch(externalApiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error en API externa (${response.status}): ${errorText}`);
            return NextResponse.json(
                { error: `La API de vuelos respondió con error: ${response.statusText}` },
                { status: response.status }
            );
        }

        const data = await response.json();

        // 5. Devolver los datos al frontend
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error al consultar la API de vuelos:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor al buscar vuelos' },
            { status: 500 }
        );
    }
}