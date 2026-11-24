// app/api/system/reservation/preview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/utils/prisma';
import { authenticateAndLimit } from '@/utils/api/authenticateAndLimit'; // 🔒 FIX: Importado
import QRCode from 'qrcode';
import fs from 'fs';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import path from 'path';

const getLogoAsBase64 = async (logoUrl: string | null | undefined): Promise<string | undefined> => {
    if (!logoUrl) return undefined;
    if (logoUrl.startsWith('http')) {
        try {
            const res = await fetch(logoUrl);
            if (!res.ok) return undefined;
            const arrayBuffer = await res.arrayBuffer();
            return `data:${res.headers.get('content-type') || 'image/png'};base64,${Buffer.from(arrayBuffer).toString('base64')}`;
        } catch (e) { return undefined; }
    }
    try {
        if (process.env.FLYCONTROL_WORKERS === 'true') {
            const asset = new URL(logoUrl, 'https://assets.local/');
            if (asset.origin !== 'https://assets.local') return undefined;
            const env = getCloudflareContext().env as unknown as {ASSETS:{fetch(request:Request):Promise<Response>}};
            const response = await env.ASSETS.fetch(new Request(asset));
            if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) return undefined;
            return `data:${response.headers.get('content-type')};base64,${Buffer.from(await response.arrayBuffer()).toString('base64')}`;
        }
        const filePath = path.join(process.cwd(), 'public', logoUrl);
        if (fs.existsSync(filePath)) {
            const buffer = fs.readFileSync(filePath);
            const ext = path.extname(filePath).replace('.', '');
            return `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${buffer.toString('base64')}`;
        }
    } catch (e) { }
    return undefined;
};

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    // 🔒 FIX: Añadimos la autenticación y rate limit
    const authResult = await authenticateAndLimit(session.user.id);
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

    try {
        const reservation = await prisma.reservation.findUnique({
            where: { id },
            include: {
                company: true, passenger: true, createdBy: { omit: { password: true } },
                departureFlights: { include: { flight: { include: { airline: true } } } },
                returnFlights: { include: { flight: { include: { airline: true } } } },
            }
        });

        if (!reservation) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

        // 🔒 FIX CRÍTICO: Verificar que la reserva pertenezca a la compañía del usuario
        if (reservation.companyId !== user.companyId) {
            return NextResponse.json({ error: 'No autorizado para ver esta reserva' }, { status: 403 });
        }

        const safeQrString = await QRCode.toDataURL(`${process.env.NEXTAUTH_URL}/verify/${reservation.id}`, { margin: 1, width: 200 });
        const logoDataUrl = await getLogoAsBase64(reservation.company?.logoUrl);

        return NextResponse.json({ reservation, qrDataUrl: safeQrString, logoDataUrl });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}