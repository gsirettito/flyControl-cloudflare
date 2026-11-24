import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { createBodySchema, deleteBodySchema, getQuerySchema, updateBodySchema } from '@/utils/api/schema';
import { buildWhere, buildOrderBy, buildGroupBy, getPrismaModel } from '@/utils/api/utils';
import { prisma } from '@/utils/prisma';
import { authenticateAndLimit } from '@/utils/api/authenticateAndLimit';
import { FlightType } from '@/types/ModelsType';
import z from 'zod';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }
        const authResult = await authenticateAndLimit(session.user.id);
        if (authResult instanceof NextResponse) return authResult;

        const prismaModel = getPrismaModel("Flight");
        const url = new URL(req.url);
        const searchParams = url.searchParams;
        const validated = getQuerySchema.parse(Object.fromEntries(searchParams.entries()));
        const { page, limit } = validated;

        let where = buildWhere(searchParams);
        where = {
            ...where,
            companyId: authResult.companyId,
            isVisible: true
        };
        const orderBy = buildOrderBy(searchParams);
        const groupByFields = buildGroupBy(searchParams);

        const selectFields = {
            id: true,
            flightNumber: true,
            airlineId: true,
            departureTime: true,
            arrivalTime: true,
            origin: true,
            destination: true,
            class: true,
            availableSeats: true,
            originName: true,
            destinationName: true,
            originTimezone: true,
            destinationTimezone: true,
            createdAt: true,
            updatedAt: true,
            airline: {
                select: { id: true, iata: true, displayName: true, logoUrl: true }
            },
            reservationDepartureFlights: {
                where: {
                    reservation: {
                        status: { not: 'REJECTED' }
                    }
                },
                select: { reservationId: true }
            },
            reservationReturnFlights: {
                where: {
                    reservation: {
                        status: { not: 'REJECTED' }
                    }
                },
                select: { reservationId: true }
            }
        };

        if (groupByFields && groupByFields.length > 0) {
            const result = await (prismaModel as any).groupBy({
                by: groupByFields,
                where,
                _count: { _all: true },
                orderBy: orderBy || undefined,
                select: selectFields
            });
            return NextResponse.json({ data: result, pagination: null });
        }

        const skip = (page - 1) * limit;
        const flights = await prismaModel.findMany({
            where,
            orderBy,
            skip,
            take: limit,
            select: selectFields
        });

        const data = flights.map((flight: any) => ({
            ...flight,
            reservedSeats: flight.reservationDepartureFlights.length + flight.reservationReturnFlights.length,
            reservationDepartureFlights: undefined,
            reservationReturnFlights: undefined,
        }));

        const total = await prismaModel.count({ where });

        return NextResponse.json({
            data,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: "Error de consulta" }, { status: 400 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();
    const authResult = await authenticateAndLimit(session.user.id);
    if (authResult instanceof NextResponse) return authResult;

    // Solo Admin puede crear vuelos (Manager no puede)
    if (!authResult.isAdmin) return forbidden();

    try {
        const body = await req.json();
        const { data } = createBodySchema.parse(body) as { data: FlightType };

        // Validaciones específicas
        if (!data.flightNumber || typeof data.flightNumber !== 'string') return badRequest('flightNumber es requerido');
        if (!data.airlineId) return badRequest('airlineId es requerido');
        if (!data.departureTime) return badRequest('departureTime es requerido');
        if (!data.arrivalTime) return badRequest('arrivalTime es requerido');
        if (!data.destinationName) return badRequest('destinationName es requerido');
        if (!data.destinationTimezone) return badRequest('destinationTimezone es requerido');
        if (!data.originName) return badRequest('originName es requerido');
        if (!data.originTimezone) return badRequest('originTimezone es requerido');
        if (!data.origin || data.origin.length !== 3) return badRequest('origin debe ser código IATA de 3 letras');
        if (!data.destination || data.destination.length !== 3) return badRequest('destination debe ser código IATA de 3 letras');
        if (!data.class || !['ECONOMY', 'BUSINESS', 'FIRST'].includes(data.class)) {
            return badRequest('class debe ser ECONOMY, BUSINESS o FIRST');
        }
        if (typeof data.availableSeats !== 'number' || data.availableSeats < 0) {
            return badRequest('availableSeats debe ser un número >= 0');
        }

        // Verificar que la aerolínea existe
        const airline = await prisma.airline.findUnique({ where: { id: data.airlineId } });
        if (!airline) return notFound('Aerolínea no encontrada');

        // Verificar que departureTime < arrivalTime
        const dep = new Date(data.departureTime);
        const arr = new Date(data.arrivalTime);
        if (dep >= arr) return badRequest('La fecha de salida debe ser anterior a la llegada');

        // Verificar unicidad
        const existing = await prisma.flight.findFirst({
            where: {
                airlineId: data.airlineId,
                flightNumber: data.flightNumber,
                departureTime: dep,
                class: data.class,
                companyId: authResult.companyId
            },
        });
        if (existing) return conflict('Ya existe un vuelo con ese número, aerolínea, fecha y clase');

        const newFlight = await prisma.flight.create({
            data: {
                flightNumber: data.flightNumber,
                airlineId: data.airlineId,
                departureTime: dep,
                arrivalTime: arr,
                origin: data.origin.toUpperCase(),
                destination: data.destination.toUpperCase(),
                originName: data.originName,
                destinationName: data.destinationName,
                originTimezone: data.originTimezone,
                destinationTimezone: data.destinationTimezone,
                class: data.class,
                availableSeats: data.availableSeats,
                companyId: authResult.companyId
            },
            include: { airline: { select: { iata: true, displayName: true } } }
        });

        return NextResponse.json(newFlight, { status: 201 });
    } catch (error: any) {
        console.error(error);
        return internalError(error);
    }
}

const updatableFields = ['flightNumber', 'departureTime', 'arrivalTime', 'origin', 'destination', 'class', 'availableSeats', 'originTimezone', 'destinationTimezone', 'originName', 'destinationName'] as const;

const updateDataSchema = z.object({
    flightNumber: z.string().min(1).max(10).optional(),
    departureTime: z.string().datetime().optional(),
    arrivalTime: z.string().datetime().optional(),
    origin: z.string().length(3).optional(),
    destination: z.string().length(3).optional(),
    class: z.enum(['ECONOMY', 'BUSINESS', 'FIRST']).optional(),
    availableSeats: z.number().int().min(0).optional(),
    originTimezone: z.string().optional(),
    destinationTimezone: z.string().optional(),
    originName: z.string().optional(),
    destinationName: z.string().optional(),
}).strict();

export async function PUT(req: NextRequest) {
    // 🔒 FIX: Eliminado el console.log("entre")
    const session = await auth();
    if (!session?.user?.id) return unauthorized();
    const authResult = await authenticateAndLimit(session.user.id);
    if (authResult instanceof NextResponse) return authResult;

    // Solo Admin puede editar vuelos
    if (!authResult.isAdmin) return forbidden();

    try {
        const body = await req.json();
        const { id, data } = updateBodySchema.parse(body);
        if (!id) return badRequest('ID inválido');

        const allowedData: Record<string, any> = {};
        for (const key of Object.keys(data)) {
            if (!updatableFields.includes(key as any)) {
                return badRequest(`El campo "${key}" no puede ser actualizado`);
            }
            allowedData[key] = data[key];
        }

        const validated = updateDataSchema.parse(allowedData);

        // Buscamos el vuelo ANTES de validar las fechas para verificar la compañía
        const flight = await prisma.flight.findUnique({ where: { id } });
        if (!flight) return notFound('Vuelo no encontrado');

        // 🔒 FIX CRÍTICO: Verificar que el vuelo pertenezca a la compañía del usuario
        if (flight.companyId !== authResult.companyId) return forbidden();

        let dep = undefined, arr = undefined;
        if (validated.departureTime) dep = new Date(validated.departureTime);
        if (validated.arrivalTime) arr = new Date(validated.arrivalTime);

        if (dep && arr && dep >= arr) return badRequest('La salida debe ser anterior a la llegada');
        if (dep && !arr) {
            if (dep >= flight.arrivalTime) return badRequest('La nueva salida debe ser anterior a la llegada existente');
        }
        if (arr && !dep) {
            if (flight.departureTime >= arr) return badRequest('La nueva llegada debe ser posterior a la salida existente');
        }

        const newFlightNumber = validated.flightNumber ?? flight.flightNumber;
        const newClass = validated.class ?? flight.class;
        const newDeparture = dep ?? flight.departureTime;
        const newAirlineId = flight.airlineId;

        const conflictFlight = await prisma.flight.findFirst({
            where: {
                airlineId: newAirlineId,
                flightNumber: newFlightNumber,
                departureTime: newDeparture,
                class: newClass,
                // 🔒 FIX: Filtrar por compañía para evitar falsos positivos entre agencias
                companyId: authResult.companyId,
                NOT: { id },
            },
        });
        if (conflictFlight) return conflict('Ya existe otro vuelo con esos datos');

        const updated = await prisma.flight.update({
            where: { id },
            data: {
                ...validated,
                departureTime: dep,
                arrivalTime: arr,
                origin: validated.origin ? validated.origin.toUpperCase() : undefined,
                destination: validated.destination ? validated.destination.toUpperCase() : undefined,
            },
            include: { airline: { select: { iata: true, displayName: true } } }
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error(error);
        return internalError(error);
    }
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();
    const authResult = await authenticateAndLimit(session.user.id);
    if (authResult instanceof NextResponse) return authResult;

    // Solo Admin puede eliminar vuelos
    if (!authResult.isAdmin) return forbidden();

    try {
        const body = await req.json();
        const { id } = deleteBodySchema.parse(body);
        if (!id) return badRequest('ID inválido');

        const flight = await prisma.flight.findUnique({ where: { id } });
        if (!flight) return notFound('Vuelo no encontrado');

        // 🔒 FIX CRÍTICO: Verificar que el vuelo pertenezca a la compañía del usuario
        if (flight.companyId !== authResult.companyId) return forbidden();

        await prisma.flight.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error(error);
        return internalError(error);
    }
}

// Funciones auxiliares
function unauthorized() { return NextResponse.json({ error: 'No autorizado' }, { status: 401 }); }
function forbidden() { return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 }); }
function badRequest(msg: string) { return NextResponse.json({ error: msg }, { status: 400 }); }
function notFound(msg: string) { return NextResponse.json({ error: msg }, { status: 404 }); }
function conflict(msg: string) { return NextResponse.json({ error: msg }, { status: 409 }); }
function internalError(error: any) {
    const message = process.env.NODE_ENV === 'production' ? 'Error interno' : error.message;
    return NextResponse.json({ error: message }, { status: 500 });
}