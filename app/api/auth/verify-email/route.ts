// app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/utils/prisma';

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get('token');

    if (!token) {
        return NextResponse.redirect(new URL('/?error=token_invalido', req.url));
    }

    try {
        const result = await prisma.$transaction(async tx => {
            const record = await tx.verificationToken.findUnique({where:{token}});
            if (!record) return 'token_invalido';
            if (record.expires <= new Date()) {
                await tx.verificationToken.deleteMany({where:{token}});
                return 'token_expirado';
            }
            const consumed = await tx.verificationToken.deleteMany({where:{token,expires:{gt:new Date()}}});
            if (!consumed.count) return 'token_invalido';
            await tx.user.update({where:{email:record.identifier},data:{emailVerified:new Date()}});
            return 'ok';
        });
        if (result !== 'ok') return NextResponse.redirect(new URL(`/?error=${result}`, req.url));
        // Redirigimos al login con un mensaje de éxito
        return NextResponse.redirect(new URL('/?verified=true', req.url));

    } catch (error) {
        console.error("Error verificando email:", error);
        return NextResponse.redirect(new URL('/?error=error_interno', req.url));
    }
}