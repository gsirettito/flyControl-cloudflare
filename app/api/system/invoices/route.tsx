// app/api/system/invoices/route.tsx
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/utils/prisma';
import { authenticateAndLimit } from '@/utils/api/authenticateAndLimit';
import { getQuerySchema } from '@/utils/api/schema';

// ============================================================
// GET - Listado de facturas con paginación
// ============================================================
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const authResult = await authenticateAndLimit(session.user.id);
    if (authResult instanceof NextResponse) return authResult;
    if (!authResult.companyId) return NextResponse.json({ error: 'Sin compañía' }, { status: 403 });

    try {
        const url = new URL(req.url);
        const searchParams = url.searchParams;
        const query = Object.fromEntries(searchParams.entries());
        const validated = getQuerySchema.parse(query);
        const { page, limit } = validated;

        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        const where = { companyId: authResult.companyId };

        const [data, total] = await prisma.$transaction([
            prisma.invoice.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    client: { select: { fullName: true } },
                    items: {
                        include: {
                            reservation: { select: { reservationCode: true } }
                        }
                    }
                }
            }),
            prisma.invoice.count({ where }),
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
        console.error('Error en GET /api/system/invoices:', error);
        return NextResponse.json({ error: 'Error de consulta' }, { status: 400 });
    }
}

// POST: Crea la factura con múltiples items
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const authResult = await authenticateAndLimit(session.user.id);
    if (authResult instanceof NextResponse) return authResult;
    if (!authResult.companyId) return NextResponse.json({ error: 'Sin compañía' }, { status: 403 });

    try {
        const body = await req.json();
        const { clientId, currency, items } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'Debe incluir al menos un servicio' }, { status: 400 });
        }

        // Calcular total
        const totalAmount = items.reduce((acc: number, item: any) => {
            // 👇 Aseguramos que quantity y amount sean números
            const qty = Number(item.quantity) || 1;
            const amt = Number(item.amount) || 0;
            return acc + (amt * qty);
        }, 0);

        // Generar número de factura
        const lastInvoice = await prisma.invoice.findFirst({
            where: { companyId: authResult.companyId },
            orderBy: { invoiceNumber: 'desc' },
            select: { invoiceNumber: true }
        });
        let nextNumber = 1;
        if (lastInvoice) {
            const numPart = lastInvoice.invoiceNumber.split('-')[1];
            if (numPart) nextNumber = parseInt(numPart) + 1;
        }
        const invoiceNumber = `FAC-${nextNumber.toString().padStart(6, '0')}`;

        const newInvoice = await prisma.invoice.create({
            data: {
                invoiceNumber,
                companyId: authResult.companyId,
                clientId: clientId || null,
                currency: currency || 'USD',
                totalAmount,
                status: 'PENDING',
                items: {
                    create: items.map((item: any) => ({
                        description: item.description,
                        amount: item.amount,
                        quantity: item.quantity || 1,
                        reservationId: item.reservationId || null,
                    }))
                }
            },
            include: { items: true }
        });

        return NextResponse.json({ success: true, invoice: newInvoice }, { status: 201 });
    } catch (error: any) {
        console.error('Error POST invoices:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: Actualiza el estado
export async function PUT(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const authResult = await authenticateAndLimit(session.user.id);
    if (authResult instanceof NextResponse) return authResult;
    if (!authResult.companyId) return NextResponse.json({ error: 'Sin compañía' }, { status: 403 });

    try {
        const { id, status } = await req.json();

        const invoice = await prisma.invoice.findUnique({ where: { id } });
        if (!invoice || invoice.companyId !== authResult.companyId) {
            return NextResponse.json({ error: 'Factura no encontrada' }, { status: 403 });
        }

        const updated = await prisma.invoice.update({
            where: { id },
            data: { status }
        });

        return NextResponse.json({ success: true, invoice: updated });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Cancela la factura
export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const authResult = await authenticateAndLimit(session.user.id);
    if (authResult instanceof NextResponse) return authResult;
    if (!authResult.companyId) return NextResponse.json({ error: 'Sin compañía' }, { status: 403 });

    try {
        const { id } = await req.json();

        const invoice = await prisma.invoice.findUnique({ where: { id } });
        if (!invoice || invoice.companyId !== authResult.companyId) {
            return NextResponse.json({ error: 'Factura no encontrada' }, { status: 403 });
        }

        if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
            return NextResponse.json({ error: 'No se puede cancelar esta factura' }, { status: 400 });
        }

        const updated = await prisma.invoice.update({
            where: { id },
            data: { status: 'CANCELLED' }
        });

        return NextResponse.json({ success: true, invoice: updated });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}