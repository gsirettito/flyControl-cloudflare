import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { createBodySchema, deleteBodySchema, getQuerySchema, updateBodySchema } from '@/utils/api/schema';
import { buildWhere, buildOrderBy, buildGroupBy, getPrismaModel } from '@/utils/api/utils';
import { prisma } from '@/utils/prisma';
import { authenticateAndLimit } from '@/utils/api/authenticateAndLimit';
import { UserType } from '@/types/ModelsType';
import z from 'zod';
import { sendEmail } from '@/utils/email';
import { loadEmailTemplate } from '@/utils/emailTemplate';

export async function GET(
    req: NextRequest
) {
    try {

        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }
        const userId = session.user.id;
        const isAdmin = session.user.isAdmin

        // === RATE LIMITING ===
        const authResult = await authenticateAndLimit(session.user.id);
        if (authResult instanceof NextResponse) return authResult;
        //const user = authResult;
        // ====================

        if (!authResult.companyId) return NextResponse.json({error:"Sin compañía"},{status:403});
        const prismaModel = getPrismaModel("user");

        const url = new URL(req.url);
        const searchParams = url.searchParams;

        // Validar parámetros básicos con Zod
        const query = Object.fromEntries(searchParams.entries());
        const validated = getQuerySchema.parse(query);
        const { page, limit } = validated;

        // Construir filtros, orden, group by e include
        let where = buildWhere(searchParams);
        if (!isAdmin) {
            where = {
                ...where,
                id: userId,
                isManager: true
            }
        }
        where = {
            ...where,
            companyId: authResult.companyId
        }
        const orderBy = buildOrderBy(searchParams);
        const groupByFields = buildGroupBy(searchParams);
        /* const include = buildInclude(searchParams); */

        const selectFields = {
            id: true,
            createdAt: true,
            name: true,
            email: true,
            isAdmin: true,
            isManager: true,
            company: {
                select: {
                    commercialName: true
                }
            }
        };

        // Si se solicita agrupamiento
        if (groupByFields && groupByFields.length > 0) {
            // Verificamos que todos los campos existan en el modelo (opcional, pero lo dejamos a Prisma)
            const result = await (prismaModel as any).groupBy({
                by: groupByFields,
                where,
                _count: { _all: true },
                orderBy: orderBy || undefined,
                select: selectFields
            });
            return NextResponse.json({ data: result, pagination: null });
        }

        // Consulta normal con paginación
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

    // === RATE LIMITING ===
    const authResult = await authenticateAndLimit(session.user.id);
    if (authResult instanceof NextResponse) return authResult;

    // Solo Admin o SuperAdmin pueden crear gestores
    if (!authResult.isAdmin && !authResult.isSuperAdmin)
        return NextResponse.json(
            { error: 'No tienes permisos para realizar esta acción' },
            { status: 401 }
        );
    // ====================

    try {
        const body = await req.json();
        const { data } = createBodySchema.parse(body) as { data: UserType };

        // 1. Verificación previa: ¿Ya existe el email?
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email }
        });
        if (existingUser) {
            return NextResponse.json(
                { error: 'Ya existe un usuario registrado con este correo electrónico.' },
                { status: 409 } // 409 Conflict
            );
        }

        const companyId = authResult.companyId;
        if (!companyId) return NextResponse.json({error:"Sin compañía"},{status:403});

        // Obtener el prefijo de la compañía para generar el código
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: {
                logoUrl: true,
                ticketPrefix: true,
                primaryColor: true,
                secondaryColor: true,
                textColor: true,
                commercialName: true,
                phone: true,
                address: true,
            },
        }) as any;

        // Opcional: validación adicional de los campos que esperas
        // (porque createBodySchema permite cualquier cosa)
        if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
            return NextResponse.json(
                { error: 'El campo "name" es requerido y debe ser texto' },
                { status: 400 }
            );
        }
        if (typeof data.email !== "string" || !/^[^@\s]+@gmail\.com$/i.test(data.email)) {
            return NextResponse.json(
                { error: 'El correo a registrar tiene que ser Gmail.' },
                { status: 400 }
            );
        }

        // Transacción para evitar race condition
        const newRecord = await prisma.$transaction(async (tx) => {
            return tx.user.create({
                data: {
                    name: data.name,
                    email: data.email,
                    isAdmin: `${data.isAdmin}` == 'true' ? true : false || false,
                    isManager: `${data.isManager}` == 'true' ? true : false || false,
                    companyId: authResult.companyId
                }
            });
        }) as any;

        // enviar email
        const template_html = await loadEmailTemplate('invitation', {
            company_primary_color: company.primaryColor,
            full_name: newRecord.name,
            inviter_name: authResult.name || '',
            url_flycontrol: process.env.NEXTAUTH_URL || "https://flycontrol.toursofgracellc.com/"
        })
        const base_html = await loadEmailTemplate('base', {
            content: template_html,
            company_logo: company.logoUrl,
            company_name: company.commercialName,
            company_phone: company.phone,
            company_email: "",
            company_address: company.address,
            company_primary_color: company.primaryColor,
            company_secondary_color: company.secondaryColor
        })
        const emailSent = await sendEmail({
            to: newRecord.email as string,
            subject: `Invitación FlyControl`,
            html: base_html,
        });
        if (!emailSent) {
            console.warn(`No se pudo enviar el email de notificacion`);
        }

        const { password: _password, ...safeRecord } = newRecord;
        return NextResponse.json(safeRecord, { status: 201 });
    } catch (error: any) {
        console.error('Error en POST /api/managers:', error);

        if (error.message === 'LIMIT_EXCEEDED') {
            return NextResponse.json(
                { error: 'Solo puedes crear hasta 10 aplicaciones' },
                { status: 400 }
            );
        }
        if (error instanceof Error && error.message.includes('Zod')) {
            return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
        }
        const message = process.env.NODE_ENV === 'production'
            ? 'Error interno del servidor'
            : error.message;
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

// Definir los campos que se pueden actualizar
const updatableFields = ['email', 'name', 'isAdmin', 'isSuperAdmin', 'isManager'] as const;
const updateDataSchema = z.object({
    email: z.string().min(1).max(100).optional(),
    name: z.string().min(1).max(100).optional(),
    isAdmin: z.boolean().optional(),
    isSuperAdmin: z.boolean().optional(),
    isManager: z.boolean().optional()
}).strict();

export async function PUT(req: NextRequest) {
    // 1. Autenticación
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // === RATE LIMITING ===
    const authResult = await authenticateAndLimit(session.user.id);
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;
    if (!user.isAdmin)
        return NextResponse.json(
            { error: 'No tienes permisos para realizar esta acción' },
            { status: 401 }
        );
    // ====================

    try {
        // 3. Validar body con el schema existente (espera { id, data })
        const body = await req.json();
        const { id, data } = updateBodySchema.parse(body);

        if (typeof data.email !== "string" || !/^[^@\s]+@gmail\.com$/i.test(data.email)) {
            return NextResponse.json(
                { error: 'El correo a registrar tiene que ser Gmail.' },
                { status: 400 }
            );
        }

        if (!id || typeof id !== 'string') {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        // 🔒 FIX: Si se está editando a sí mismo, bloquear cambios de rol
        if (id === user.id) {
            if (
                (data.isAdmin !== undefined && data.isAdmin !== user.isAdmin) ||
                (data.isManager !== undefined && data.isManager !== user.isManager) ||
                (data.isSuperAdmin !== undefined && data.isSuperAdmin !== user.isSuperAdmin)
            ) {
                return NextResponse.json(
                    { error: 'No puedes cambiar tus propios permisos o roles.' },
                    { status: 400 }
                );
            }
        }

        // 4. Validar que los campos a actualizar están permitidos
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

        // Validar tipos y valores con el schema detallado
        const validatedData = updateDataSchema.parse(allowedData);
        if (validatedData.isSuperAdmin !== undefined && validatedData.isSuperAdmin && !user.isSuperAdmin) return NextResponse.json({error:'No autorizado'}, {status:403});

        // 5. Verificar existencia y ownership de la aplicación
        const application = await prisma.user.findUnique({
            where: { id },
            select: { id: true, companyId: true, isSuperAdmin: true, isAdmin: true, email: true }
        });

        if (!application || !user.companyId || application.companyId !== user.companyId || (application.isSuperAdmin && !user.isSuperAdmin)) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        if (validatedData.email && validatedData.email !== application.email) return NextResponse.json({error:"No se puede cambiar el correo de una cuenta existente desde gestores"},{status:400});
        // 6. Realizar la actualización (opcionalmente en transacción, aunque no es crítico aquí)
        const updated = await prisma.user.update({
            where: { id, companyId: user.companyId },
            data: validatedData,
        });

        const { password: _password, ...safeRecord } = updated;
        return NextResponse.json(safeRecord);
    } catch (error: any) {
        console.error('Error en PUT /api/managers', error);

        if (error.message?.includes('Record to update not found')) {
            return NextResponse.json({ error: 'Gestor no encontrada' }, { status: 404 });
        }
        const message = process.env.NODE_ENV === 'production'
            ? 'Error interno del servidor'
            : error.message;
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest) {
    // 1. Autenticación
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // === RATE LIMITING ===
    const authResult = await authenticateAndLimit(session.user.id);
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;
    if (!user.isAdmin)
        return NextResponse.json(
            { error: 'No tienes permisos para realizar esta acción' },
            { status: 401 }
        );
    // ====================

    try {
        // 3. Obtener y validar el id
        const body = await req.json();
        const { id } = deleteBodySchema.parse(body);

        if (!id || typeof id !== 'string') {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        if (id === user.id) {
            return NextResponse.json(
                { error: 'No puedes eliminar tu propio perfil de usuario.' },
                { status: 400 }
            );
        }

        // 4. Verificar existencia y ownership de la aplicación
        const application = await prisma.user.findUnique({
            where: { id },
            select: { id: true, companyId: true, isSuperAdmin: true, isAdmin: true, email: true }
        });

        if (!application || !user.companyId || application.companyId !== user.companyId || (application.isSuperAdmin && !user.isSuperAdmin)) {
            return NextResponse.json({ error: 'Usuario no encontrada' }, { status: 404 });
        }

        // 5. Realizar la eliminación
        // Las relaciones (OTPRequest, SmsLogs) tienen onDelete: Cascade, por lo que se eliminan automáticamente
        await prisma.user.delete({
            where: { id, companyId: user.companyId },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error en DELETE /api/manager:', error);

        // Error de Prisma: registro no encontrado (podría ocurrir por race condition)
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Usuario no encontrada' }, { status: 404 });
        }

        const message = process.env.NODE_ENV === 'production'
            ? 'Error interno del servidor'
            : error.message;
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

