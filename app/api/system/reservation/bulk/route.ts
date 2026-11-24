// app/api/system/reservation/bulk/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/utils/prisma';
import { parseBulkText } from '@/utils/bulkParser';
import { generateReservationCode } from '@/utils/reservationCode';
import { getAirportData } from '@/utils/airports';

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: session.user.id }, include: { company: true } });
    if (!user?.companyId || !user.company) return NextResponse.json({ error: 'Compañía no configurada' }, { status: 400 });

    try {
        const { text } = await req.json();
        if (!text) return NextResponse.json({ error: 'Texto vacío' }, { status: 400 });

        const parsed = parseBulkText(text);
        
        // Validación: Si no hay ni pasajeros ni vuelos, error.
        if (parsed.passengers.length === 0 && parsed.departureFlights.length === 0 && parsed.returnFlights.length === 0) {
            throw new Error('No se encontraron datos válidos (ni pasajeros ni vuelos) en el texto.');
        }

        let createdPassengersCount = 0;
        let createdFlightsCount = 0;
        let createdReservationsCount = 0;

        await prisma.$transaction(async (tx) => {
            // 1. Procesar Vuelos (Si los hay)
            const departureFlightIds: string[] = [];
            const returnFlightIds: string[] = [];

            const processFlight = async (f: any) => {
                const airline = await tx.airline.findFirst({
                    where: { OR: [{ iata: f.airlineIata }, { displayName: f.airlineIata }] }
                });
                if (!airline) throw new Error(`La aerolínea "${f.airlineIata}" no existe.`);

                const originData = getAirportData(f.origin);
                const destData = getAirportData(f.destination);
                if (!originData) throw new Error(`Aeropuerto origen "${f.origin}" no existe.`);
                if (!destData) throw new Error(`Aeropuerto destino "${f.destination}" no existe.`);

                let flight = await tx.flight.findFirst({
                    where: {
                        flightNumber: f.flightNumber,
                        airlineId: airline.id,
                        departureTime: f.departureTime,
                        companyId: user.companyId!
                    }
                });

                if (!flight) {
                    flight = await tx.flight.create({
                        data: {
                            flightNumber: f.flightNumber,
                            airlineId: airline.id,
                            departureTime: f.departureTime,
                            arrivalTime: f.arrivalTime,
                            origin: originData.iata || originData.icao,
                            destination: destData.iata || destData.icao,
                            originName: originData.name,
                            destinationName: destData.name,
                            originTimezone: originData.tz,
                            destinationTimezone: destData.tz,
                            class: f.class,
                            availableSeats: 100,
                            companyId: user.companyId
                        }
                    });
                    createdFlightsCount++;
                }
                return flight.id;
            };

            for (const f of parsed.departureFlights) departureFlightIds.push(await processFlight(f));
            for (const f of parsed.returnFlights) returnFlightIds.push(await processFlight(f));

            // 2. Procesar Pasajeros (Si los hay)
            const clientIds: string[] = [];

            for (const p of parsed.passengers) {
                let client = await tx.client.findUnique({ where: { passportNumber: p.passportNumber } });
                if (!client) {
                    client = await tx.client.create({
                        data: {
                            fullName: p.fullName,
                            passportNumber: p.passportNumber,
                            passportIssueDate: p.passportIssueDate,
                            passportExpiryDate: p.passportExpiryDate,
                            birthDate: p.birthDate,
                            nationality: p.nationality,
                            phone: p.phone,
                            email: p.email,
                            type: 'ADULT', // Idealmente calcularlo por edad
                            companyId: user.companyId!
                        }
                    });
                    createdPassengersCount++;
                }
                clientIds.push(client.id);
            }

            // 3. Crear Reservas (SOLO si hay pasajeros Y vuelos)
            if (clientIds.length > 0 && (departureFlightIds.length > 0 || returnFlightIds.length > 0)) {
                for (const clientId of clientIds) {
                    const reservationCode = await generateReservationCode(user.company!.ticketPrefix || 'TKT');
                    
                    const reservation = await tx.reservation.create({
                        data: {
                            reservationCode,
                            tripType: returnFlightIds.length > 0 ? 'ROUND_TRIP' : 'ONE_WAY',
                            passengerId: clientId,
                            createdByUserId: user.id,
                            companyId: user.companyId!,
                            baggage: parsed.baggage,
                            status: 'PENDING',
                        }
                    });

                    for (const fId of departureFlightIds) {
                        await tx.reservationDepartureFlight.create({ data: { reservationId: reservation.id, flightId: fId } });
                    }
                    for (const fId of returnFlightIds) {
                        await tx.reservationReturnFlight.create({ data: { reservationId: reservation.id, flightId: fId } });
                    }
                    createdReservationsCount++;
                }
            }
        });

        // Construir mensaje de éxito dinámico
        let message = 'Proceso completado: ';
        if (createdPassengersCount > 0) message += `${createdPassengersCount} pasajeros. `;
        if (createdFlightsCount > 0) message += `${createdFlightsCount} vuelos. `;
        if (createdReservationsCount > 0) message += `${createdReservationsCount} reservas. `;

        return NextResponse.json({ success: true, message });

    } catch (error: any) {
        console.error('Error en importación masiva:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}