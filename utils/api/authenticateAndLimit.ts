import { UserType } from "@/types/ModelsType";
import { NextResponse } from "next/server";
import { rateLimiter } from "@/libs/rate-limit";
import { prisma } from "../prisma";

// Autenticación y rate limiting
export async function authenticateAndLimit(userId: string): Promise<UserType | NextResponse> {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { company: true } }) as any;
    if (!user) return NextResponse.json({error:"No autorizado"},{status:401});
    const identifier = `apiv2:${userId}`;
    const { success } = await rateLimiter.limit(identifier);
    if (!success) {
        return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 }) as any;
    }

    return user;
}