import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { createBodySchema, deleteBodySchema, getQuerySchema, updateBodySchema } from '@/utils/api/schema';
import { buildWhere, buildOrderBy, buildGroupBy, getPrismaModel } from '@/utils/api/utils';
import { prisma } from '@/utils/prisma';
import { authenticateAndLimit } from '@/utils/api/authenticateAndLimit';
import { CompanyType } from '@/types/ModelsType';
import z from 'zod';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }
        const isAdmin = session.user.isAdmin;

        const authResult = await authenticateAndLimit(session.user.id);
        if (authResult instanceof NextResponse) return authResult;

        const prismaModel = getPrismaModel("Company");
        const url = new URL(req.url);
        const searchParams = url.searchParams;

        const query = Object.fromEntries(searchParams.entries());
        const validated = getQuerySchema.parse(query);
        const { page, limit } = validated;

        let where = buildWhere(searchParams);
        if (!isAdmin) {
            where = { ...where };
        }
        const orderBy = buildOrderBy(searchParams);
        const groupByFields = buildGroupBy(searchParams);

        const selectFields = {
            id: true,
            createdAt: true,
            commercialName: true,
            logoUrl: true,
            primaryColor: true,
            secondaryColor: true,
            textColor: true,
            phone: true,
            address: true,
            ticketPrefix: true,
            preReservationExpiryHours: true,
            notifySmsConfirm: false,
            notifyEmailConfirm: false,
            notifyManagerEmail: false,
            notifyFlightReminders: false,
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

    // 🔒 FIX: Cambiado a 403 (Forbidden) y restringido solo a Admins
    if (!user.isAdmin) {
        return NextResponse.json({ error: 'No tienes permisos para realizar esta acción' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { data } = createBodySchema.parse(body) as { data: CompanyType };

        if (!data.commercialName || typeof data.commercialName !== 'string' || data.commercialName.trim() === '') {
            return NextResponse.json({ error: 'El campo "commercialName" es requerido y debe ser texto' }, { status: 400 });
        }

        const newRecord = await prisma.$transaction(async (tx) => {
            return tx.company.create({
                data: {
                    commercialName: data.commercialName,
                    logoUrl: data.logoUrl || '',
                    primaryColor: data.primaryColor || '#000000',
                    secondaryColor: data.secondaryColor || '#ffffff',
                    textColor: data.textColor || '#000000',
                    phone: data.phone || '',
                    address: data.address || '',
                    ticketPrefix: data.ticketPrefix || '',
                    preReservationExpiryHours: parseInt(`${data.preReservationExpiryHours}` || '0'),
                },
            });
        });

        const { ...safeRecord } = newRecord;
        return NextResponse.json(safeRecord, { status: 201 });
    } catch (error: any) {
        console.error('Error en POST /api/application:', error);
        if (error instanceof Error && error.message.includes('Zod')) {
            return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
        }
        const message = process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : error.message;
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

const updatableFields = [
    'commercialName', 'logoUrl', 'primaryColor', 'secondaryColor',
    'textColor', 'phone', 'address', 'ticketPrefix', 'preReservationExpiryHours',
    'notifySmsConfirm', 'notifyEmailConfirm', 'notifyManagerEmail', 'notifyFlightReminders'
] as const;

const updateDataSchema = z.object({
    commercialName: z.string().min(1).max(100).optional(),
    logoUrl: z.string().refine((val) => {
        return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/');
    }, { message: "Debe ser una URL válida o una ruta local válida" }).optional().nullable(),
    primaryColor: z.string().min(1),
    secondaryColor: z.string().min(1),
    textColor: z.string().min(1),
    phone: z.string().min(1).max(20),
    address: z.string().min(1).max(200),
    ticketPrefix: z.string().min(1).max(20),
    preReservationExpiryHours: z.number().int().min(24).max(168),
    notifySmsConfirm: z.boolean().optional(),
    notifyEmailConfirm: z.boolean().optional(),
    notifyManagerEmail: z.boolean().optional(),
    notifyFlightReminders: z.boolean().optional(),
}).strict();

export async function PUT(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const authResult = await authenticateAndLimit(session.user.id);
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    // 🔒 FIX: Si no es Admin, no puede configurar la empresa (Gestores bloqueados)
    if (!user.isAdmin) {
        return NextResponse.json({ error: 'Solo los administradores pueden configurar la empresa' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { id, data } = updateBodySchema.parse(body);

        if (!id || typeof id !== 'string') {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        // 🔒 FIX CRÍTICO: Verificar que el Admin solo edite SU PROPIA empresa
        if (id !== user.companyId && !user.isSuperAdmin) {
            return NextResponse.json({ error: 'No tienes permisos para editar otra compañía' }, { status: 403 });
        }

        const allowedData: Record<string, any> = {};
        for (const key of Object.keys(data)) {
            if (!updatableFields.includes(key as any)) {
                return NextResponse.json({ error: `El campo "${key}" no puede ser actualizado` }, { status: 400 });
            }
            allowedData[key] = data[key];
        }

        const validatedData = updateDataSchema.parse(allowedData);

        const application = await prisma.company.findUnique({
            where: { id },
            select: { id: true }
        });

        if (!application) {
            return NextResponse.json({ error: 'Aplicación no encontrada' }, { status: 404 });
        }

        const updated = await prisma.company.update({
            where: { id },
            data: {
                ...validatedData,
                // 🔒 FIX: Si el logo viene null, lo guardamos como string vacío para que Prisma no falle.
                logoUrl: validatedData.logoUrl ?? '', 
            },
        });

        const { ...safeRecord } = updated;
        return NextResponse.json(safeRecord);
    } catch (error: any) {
        console.error('Error en PUT /api/application:', error);
        if (error.message?.includes('Record to update not found')) {
            return NextResponse.json({ error: 'Aplicación no encontrada' }, { status: 404 });
        }
        const message = process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : error.message;
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

    // 🔒 FIX: Solo Admin puede borrar (y en la práctica, solo un SuperAdmin debería borrar empresas completas)
    if (!user.isAdmin) {
        return NextResponse.json({ error: 'No tienes permisos para realizar esta acción' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { id } = deleteBodySchema.parse(body);

        if (!id || typeof id !== 'string') {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        // 🔒 FIX CRÍTICO: Evitar que un Admin borre la empresa de otro
        if (id !== user.companyId && !user.isSuperAdmin) {
            return NextResponse.json({ error: 'No puedes eliminar una compañía que no sea la tuya' }, { status: 403 });
        }

        const application = await prisma.company.findUnique({
            where: { id },
            select: { id: true }
        });

        if (!application) {
            return NextResponse.json({ error: 'Aplicación no encontrada' }, { status: 404 });
        }

        await prisma.company.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error en DELETE /api/company:', error);
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Aplicación no encontrada' }, { status: 404 });
        }
        const message = process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : error.message;
        return NextResponse.json({ error: message }, { status: 400 });
    }
}