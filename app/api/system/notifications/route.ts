// app/api/system/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/utils/prisma';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.companyId) return NextResponse.json({ data: [] });

    // Un admin ve todas las de la empresa, un gestor solo las suyas
    const whereCondition = user.isAdmin
        ? { companyId: user.companyId }
        : { userId: user.id };

    const notifications = await prisma.notification.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
        take: 20
    });

    return NextResponse.json({ data: notifications });
}

// POST: Marcar como leídas
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { ids } = await req.json(); // Si no envían ids, marcamos todas

    await prisma.notification.updateMany({
        where: {
            userId: session.user.id,
            ...(ids && ids.length > 0 ? { id: { in: ids } } : {})
        },
        data: { isRead: true }
    });

    return NextResponse.json({ success: true });
}