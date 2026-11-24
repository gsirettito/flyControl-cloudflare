import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { createBodySchema, deleteBodySchema, getQuerySchema, updateBodySchema } from '@/utils/api/schema';
import { buildWhere, buildOrderBy, buildGroupBy, getPrismaModel } from '@/utils/api/utils';
import { prisma } from '@/utils/prisma';
import { authenticateAndLimit } from '@/utils/api/authenticateAndLimit';
import { AirlineType } from '@/types/ModelsType';
import z from 'zod';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }
        const userId = session.user.id;
        const isAdmin = session.user.isAdmin;

        // Rate limiting
        const authResult = await authenticateAndLimit(session.user.id);
        if (authResult instanceof NextResponse) return authResult;

        const prismaModel = getPrismaModel("Airline");

        const url = new URL(req.url);
        const searchParams = url.searchParams;

        const query = Object.fromEntries(searchParams.entries());
        const validated = getQuerySchema.parse(query);
        const { page, limit } = validated;

        let where = buildWhere(searchParams);
        if (!isAdmin) {
            // Si no es admin, solo puede ver aerolíneas activas (o todas según política)
            // Aquí puedes decidir: por defecto mostramos todas, pero puedes filtrar por active = true si quieres.
            // where = { ...where, active: true };
        }
        const orderBy = buildOrderBy(searchParams);
        const groupByFields = buildGroupBy(searchParams);

        const selectFields = {
            id: true,
            iata: true,
            icao: true,
            officialName: true,
            displayName: true,
            logoUrl: true,
            active: true,
            createdAt: true,
            updatedAt: true,
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
        const [data, total] = await prisma.$transaction([
            prismaModel.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                select: selectFields
            }),
            prismaModel.count({ where }),
        ]);

        return NextResponse.json({
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: "Error de consulta" }, { status: 400 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const authResult = await authenticateAndLimit(session.user.id);
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;
    if (!user.isAdmin) {
        return NextResponse.json(
            { error: 'No tienes permisos para realizar esta acción' },
            { status: 401 }
        );
    }

    try {
        const body = await req.json();
        const { data } = createBodySchema.parse(body) as { data: AirlineType };
        console.log(data)

        // Validaciones específicas
        if (!data.iata || typeof data.iata !== 'string' || data.iata.trim().length !== 2) {
            return NextResponse.json(
                { error: 'El campo "iata" es requerido y debe ser un código de 2 letras' },
                { status: 400 }
            );
        }
        if (!data.icao || typeof data.icao !== 'string' || data.icao.trim().length !== 3) {
            return NextResponse.json(
                { error: 'El campo "icao" es requerido y debe ser un código de 3 letras' },
                { status: 400 }
            );
        }
        if (!data.officialName || typeof data.officialName !== 'string' || data.officialName.trim() === '') {
            return NextResponse.json(
                { error: 'El campo "officialName" es requerido' },
                { status: 400 }
            );
        }
        if (!data.displayName || typeof data.displayName !== 'string' || data.displayName.trim() === '') {
            return NextResponse.json(
                { error: 'El campo "displayName" es requerido' },
                { status: 400 }
            );
        }

        // Verificar unicidad de iata e icao
        const existingByIata = await prisma.airline.findUnique({ where: { iata: data.iata.toUpperCase() } });
        if (existingByIata) {
            return NextResponse.json({ error: 'Ya existe una aerolínea con ese código IATA' }, { status: 400 });
        }
        const existingByIcao = await prisma.airline.findUnique({ where: { icao: data.icao.toUpperCase() } });
        if (existingByIcao) {
            return NextResponse.json({ error: 'Ya existe una aerolínea con ese código ICAO' }, { status: 400 });
        }

        const newRecord = await prisma.airline.create({
            data: {
                iata: data.iata.toUpperCase(),
                icao: data.icao.toUpperCase(),
                officialName: data.officialName,
                displayName: data.displayName,
                logoUrl: data.logoUrl || null,
                active: data.active !== undefined ? data.active : true,
            },
        });

        return NextResponse.json(newRecord, { status: 201 });
    } catch (error: any) {
        console.error('Error en POST /api/airline:', error);
        if (error.message === 'LIMIT_EXCEEDED') {
            return NextResponse.json({ error: 'Límite de creación excedido' }, { status: 400 });
        }
        const message = process.env.NODE_ENV === 'production'
            ? 'Error interno del servidor'
            : error.message;
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

// Campos permitidos para actualizar
const updatableFields = ['iata', 'icao', 'officialName', 'displayName', 'logoUrl', 'active'] as const;
const updateDataSchema = z.object({
    iata: z.string().length(2).toUpperCase().optional(),
    icao: z.string().length(3).toUpperCase().optional(),
    officialName: z.string().min(1).max(200).optional(),
    displayName: z.string().min(1).max(100).optional(),
    logoUrl: z.string().url().nullable().optional(),
    active: z.boolean().optional(),
}).strict();

export async function PUT(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const authResult = await authenticateAndLimit(session.user.id);
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;
    if (!user.isAdmin) {
        return NextResponse.json(
            { error: 'No tienes permisos para realizar esta acción' },
            { status: 401 }
        );
    }

    try {
        const body = await req.json();
        const { id, data } = updateBodySchema.parse(body);

        if (!id || typeof id !== 'string') {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        // Filtrar solo campos permitidos
        const allowedData: Record<string, any> = {};
        for (const key of Object.keys(data)) {
            if (!updatableFields.includes(key as any)) {
                return NextResponse.json(
                    { error: `El campo "${key}" no puede ser actualizado` },
                    { status: 400 }
                );
            }
            allowedData[key] = data[key];
        }

        // Validar con el schema detallado
        const validatedData = updateDataSchema.parse(allowedData);

        // Si se actualiza iata o icao, verificar unicidad (excluyendo el registro actual)
        if (validatedData.iata) {
            const existing = await prisma.airline.findFirst({
                where: { iata: validatedData.iata, NOT: { id } },
            });
            if (existing) {
                return NextResponse.json({ error: 'Ya existe otra aerolínea con ese código IATA' }, { status: 400 });
            }
        }
        if (validatedData.icao) {
            const existing = await prisma.airline.findFirst({
                where: { icao: validatedData.icao, NOT: { id } },
            });
            if (existing) {
                return NextResponse.json({ error: 'Ya existe otra aerolínea con ese código ICAO' }, { status: 400 });
            }
        }

        const updated = await prisma.airline.update({
            where: { id },
            data: validatedData,
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error('Error en PUT /api/airline:', error);
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Aerolínea no encontrada' }, { status: 404 });
        }
        const message = process.env.NODE_ENV === 'production'
            ? 'Error interno del servidor'
            : error.message;
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const authResult = await authenticateAndLimit(session.user.id);
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;
    if (!user.isAdmin) {
        return NextResponse.json(
            { error: 'No tienes permisos para realizar esta acción' },
            { status: 401 }
        );
    }

    try {
        const body = await req.json();
        const { id } = deleteBodySchema.parse(body);

        if (!id || typeof id !== 'string') {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        const airline = await prisma.airline.findUnique({
            where: { id },
            select: { id: true }
        });

        if (!airline) {
            return NextResponse.json({ error: 'Aerolínea no encontrada' }, { status: 404 });
        }

        await prisma.airline.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error en DELETE /api/airline:', error);
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Aerolínea no encontrada' }, { status: 404 });
        }
        const message = process.env.NODE_ENV === 'production'
            ? 'Error interno del servidor'
            : error.message;
        return NextResponse.json({ error: message }, { status: 400 });
    }
}