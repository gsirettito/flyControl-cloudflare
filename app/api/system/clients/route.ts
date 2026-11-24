import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { createBodySchema, deleteBodySchema, getQuerySchema, updateBodySchema } from '@/utils/api/schema';
import { buildWhere, buildOrderBy, buildGroupBy, getPrismaModel } from '@/utils/api/utils';
import { prisma } from '@/utils/prisma';
import { authenticateAndLimit } from '@/utils/api/authenticateAndLimit';
import { ClientTypeType } from '@/types/ModelsType';
import z from 'zod';

// Valores permitidos para el enum
const CLIENT_TYPES = ['INFANT', 'CHILD', 'ADULT'] as const;

// Helper para validar fechas
const isValidDate = (date: Date) => !isNaN(date.getTime());

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }
        const authResult = await authenticateAndLimit(session.user.id);
        if (authResult instanceof NextResponse) return authResult;
        const isAdmin = session.user.isAdmin;

        const prismaModel = getPrismaModel('Client');
        const url = new URL(req.url);
        const searchParams = url.searchParams;
        const validated = getQuerySchema.parse(Object.fromEntries(searchParams.entries()));
        const { page, limit } = validated;

        let where = buildWhere(searchParams);
        where = {
            ...where,
            companyId: authResult.companyId,
        };
        const orderBy = buildOrderBy(searchParams);
        const groupByFields = buildGroupBy(searchParams);

        const selectFields = {
            id: true,
            fullName: true,
            passportNumber: true,
            email: true,
            phone: true,
            passportIssueDate: true,
            passportExpiryDate: true,
            type: true,
            nationality: true,
            birthDate: true,
            createdAt: true,
            updatedAt: true,
        };

        if (groupByFields && groupByFields.length > 0) {
            const result = await (prismaModel as any).groupBy({
                by: groupByFields,
                where,
                _count: { _all: true },
                orderBy: orderBy || undefined,
                select: selectFields,
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
                select: selectFields,
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
        return NextResponse.json({ error: 'Error de consulta' }, { status: 400 });
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

    // 🔒 FIX: Permitir creación a Administradores y Managers
    if (!user.isAdmin && !user.isManager) {
        return NextResponse.json(
            { error: 'No tienes permisos para realizar esta acción' },
            { status: 403 },
        );
    }

    try {
        const body = await req.json();
        const { data } = createBodySchema.parse(body) as { data: any };

        // Validaciones específicas
        if (!data.fullName || typeof data.fullName !== 'string' || data.fullName.trim() === '') {
            return badRequest('El campo fullName es requerido');
        }
        if (!data.passportNumber || typeof data.passportNumber !== 'string' || data.passportNumber.trim() === '') {
            return badRequest('El número de pasaporte es requerido');
        }
        if (!data.phone || typeof data.phone !== 'string') {
            return badRequest('El teléfono es requerido');
        }
        if (!data.type || !CLIENT_TYPES.includes(data.type)) {
            return badRequest('Tipo de pasajero inválido: debe ser INFANT, CHILD o ADULT');
        }
        if (!data.nationality || typeof data.nationality !== 'string') {
            return badRequest('La nacionalidad es requerida');
        }
        if (!data.birthDate) {
            return badRequest('La fecha de nacimiento es requerida');
        }
        if (!data.passportExpiryDate) {
            return badRequest('La fecha de vencimiento del pasaporte es requerida');
        }

        // Convertir fechas
        const birthDate = new Date(data.birthDate);
        if (!isValidDate(birthDate)) return badRequest('Fecha de nacimiento inválida');

        const passportExpiryDate = new Date(data.passportExpiryDate);
        if (!isValidDate(passportExpiryDate)) return badRequest('Fecha de vencimiento inválida');

        let passportIssueDate: Date | null = null;
        if (data.passportIssueDate) {
            passportIssueDate = new Date(data.passportIssueDate);
            if (!isValidDate(passportIssueDate)) return badRequest('Fecha de emisión inválida');
            if (passportIssueDate >= passportExpiryDate) {
                return badRequest('La fecha de emisión debe ser anterior a la fecha de vencimiento');
            }
        }

        // Validar coherencia entre tipo y edad
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;

        let expectedType: string;
        if (age < 2) expectedType = 'INFANT';
        else if (age <= 11) expectedType = 'CHILD';
        else expectedType = 'ADULT';

        if (data.type !== expectedType) {
            return badRequest(`La edad del pasajero (${age} años) no corresponde al tipo ${data.type}. El tipo correcto es ${expectedType}`);
        }

        // Verificar unicidad del pasaporte
        const existing = await prisma.client.findUnique({
            where: { passportNumber: data.passportNumber },
        });
        if (existing) {
            return conflict('Ya existe un cliente con ese número de pasaporte');
        }

        const newClient = await prisma.client.create({
            data: {
                fullName: data.fullName,
                passportNumber: data.passportNumber,
                email: data.email || null,
                phone: data.phone,
                passportIssueDate: passportIssueDate,
                passportExpiryDate: passportExpiryDate,
                type: data.type as ClientTypeType,
                nationality: data.nationality,
                birthDate: birthDate,
                companyId: user.companyId,
            },
        });

        return NextResponse.json(newClient, { status: 201 });
    } catch (error: any) {
        console.error('Error en POST /api/client:', error);
        return internalError(error);
    }
}

// Campos permitidos para actualizar
const updatableFields = ['fullName', 'passportNumber', 'email', 'phone', 'passportIssueDate', 'passportExpiryDate', 'type', 'nationality', 'birthDate'] as const;
const updateDataSchema = z.object({
    fullName: z.string().min(1).max(200).optional(),
    passportNumber: z.string().min(1).max(50).optional(),
    email: z.string().email().nullable().optional(),
    phone: z.string().min(1).max(20).optional(),
    passportIssueDate: z.string().datetime().nullable().optional(),
    passportExpiryDate: z.string().datetime().optional(),
    type: z.enum(CLIENT_TYPES).optional(),
    nationality: z.string().min(1).max(100).optional(),
    birthDate: z.string().datetime().optional(),
}).strict();

export async function PUT(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();
    const authResult = await authenticateAndLimit(session.user.id);
    if (authResult instanceof NextResponse) return authResult;

    // 🔒 FIX: Permitir edición a Administradores y Managers
    if (!authResult.isAdmin && !authResult.isManager) return forbidden();

    try {
        const body = await req.json();
        const { id, data } = updateBodySchema.parse(body);
        if (!id) return badRequest('ID inválido');

        // Filtrar campos permitidos
        const allowedData: Record<string, any> = {};
        for (const key of Object.keys(data)) {
            if (!updatableFields.includes(key as any)) {
                return badRequest(`El campo "${key}" no puede ser actualizado`);
            }
            allowedData[key] = data[key];
        }

        const validated = updateDataSchema.parse(allowedData);
        const existingClient = await prisma.client.findUnique({ where: { id } });
        if (!existingClient) return notFound('Cliente no encontrado');

        // 🔒 FIX: verificar que el cliente pertenezca a la compañía del usuario
        if (existingClient.companyId !== authResult.companyId) return forbidden();

        // Validar unicidad de pasaporte si cambia
        if (validated.passportNumber && validated.passportNumber !== existingClient.passportNumber) {
            const duplicate = await prisma.client.findFirst({
                where: { passportNumber: validated.passportNumber, NOT: { id } },
            });
            if (duplicate) return conflict('Ya existe otro cliente con ese número de pasaporte');
        }

        // Procesar fechas
        let birthDate: Date | undefined = undefined;
        if (validated.birthDate) {
            birthDate = new Date(validated.birthDate);
            if (!isValidDate(birthDate)) return badRequest('Fecha de nacimiento inválida');
        }
        let passportIssueDate: Date | null | undefined = undefined;
        if (validated.passportIssueDate !== undefined) {
            if (validated.passportIssueDate === null) {
                passportIssueDate = null;
            } else {
                passportIssueDate = new Date(validated.passportIssueDate);
                if (!isValidDate(passportIssueDate)) return badRequest('Fecha de emisión inválida');
            }
        }
        let passportExpiryDate: Date | undefined = undefined;
        if (validated.passportExpiryDate) {
            passportExpiryDate = new Date(validated.passportExpiryDate);
            if (!isValidDate(passportExpiryDate)) return badRequest('Fecha de vencimiento inválida');
        }

        // Validar orden de fechas si ambas están presentes
        const finalIssue = passportIssueDate !== undefined ? passportIssueDate : existingClient.passportIssueDate;
        const finalExpiry = passportExpiryDate || existingClient.passportExpiryDate;
        if (finalIssue && finalExpiry && finalIssue >= finalExpiry) {
            return badRequest('La fecha de emisión debe ser anterior a la fecha de vencimiento');
        }

        // Validar coherencia de edad con tipo si cambia birthDate o type
        const newType = validated.type || existingClient.type;
        const newBirthDate = birthDate || existingClient.birthDate;
        const today = new Date();
        let age = today.getFullYear() - newBirthDate.getFullYear();
        const monthDiff = today.getMonth() - newBirthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < newBirthDate.getDate())) age--;

        let expectedType: string;
        if (age < 2) expectedType = 'INFANT';
        else if (age <= 11) expectedType = 'CHILD';
        else expectedType = 'ADULT';

        if (newType !== expectedType) {
            return badRequest(`La edad del pasajero (${age} años) no corresponde al tipo ${newType}. El tipo correcto es ${expectedType}`);
        }

        const updated = await prisma.client.update({
            where: { id },
            data: {
                fullName: validated.fullName,
                passportNumber: validated.passportNumber,
                email: validated.email !== undefined ? validated.email : undefined,
                phone: validated.phone,
                passportIssueDate: passportIssueDate,
                passportExpiryDate: passportExpiryDate,
                type: validated.type as ClientTypeType,
                nationality: validated.nationality,
                birthDate: birthDate,
            },
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error('Error en PUT /api/client:', error);
        return internalError(error);
    }
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();
    const authResult = await authenticateAndLimit(session.user.id);
    if (authResult instanceof NextResponse) return authResult;
    
    // 🔒 FIX: Permitir eliminación a Administradores y Managers
    if (!authResult.isAdmin && !authResult.isManager) return forbidden();

    try {
        const body = await req.json();
        const { id } = deleteBodySchema.parse(body);
        if (!id) return badRequest('ID inválido');

        const client = await prisma.client.findUnique({ where: { id } });
        if (!client) return notFound('Cliente no encontrado');

        // 🔒 FIX: verificar que el cliente pertenezca a la compañía del usuario
        if (client.companyId !== authResult.companyId) return forbidden();

        await prisma.client.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error en DELETE /api/client:', error);
        if (error.code === 'P2025') return notFound('Cliente no encontrado');
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
    const message = process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : error.message;
    return NextResponse.json({ error: message }, { status: 500 });
}