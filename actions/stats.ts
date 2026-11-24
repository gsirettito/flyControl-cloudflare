// actions/stats.ts
'use server';

import { auth } from '@/auth';
import { prisma } from '@/utils/prisma';

export async function getHeaderStats() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { users: 0, reservations: 0, airlines: 0, clients: 0 };

        // Obtener el usuario de la BD para saber su compañía y rol
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true, isSuperAdmin: true }
        });

        if (!user) return { users: 0, reservations: 0, airlines: 0, clients: 0 };

        // FILTRO DE SEGURIDAD: Si no es superadmin y no tiene compañía, devolvemos 0
        if (!user.isSuperAdmin && !user.companyId) {
            return { users: 0, reservations: 0, airlines: 0, clients: 0 };
        }

        // Si es superAdmin ve todo, si no, solo lo de su compañía
        const filter = user.isSuperAdmin ? {} : { companyId: user.companyId || undefined };

        const [users, reservations, airlines, clients] = await prisma.$transaction([
            prisma.user.count({ where: filter }),
            prisma.reservation.count({ where: filter }),
            prisma.airline.count({ where: { active: true } }), // Aerolíneas son globales
            prisma.client.count({ where: filter }),
        ]);

        return { users, reservations, airlines, clients };
    } catch (error) {
        console.error('Error fetching header stats:', error);
        return { users: 0, reservations: 0, airlines: 0, clients: 0 };
    }
}