// app/api/system/reservation/refresh-pdf/route.tsx
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/utils/prisma';
import { authenticateAndLimit } from '@/utils/api/authenticateAndLimit';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoicePDF } from '@/components/InvoicePDF';
import QRCode from 'qrcode';
import { uploadFile } from '@/utils/storage';
import fs from 'fs';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import path from 'path';

const getLogoAsBase64 = async (logoUrl: string | null | undefined): Promise<string | undefined> => {
    if (!logoUrl) return undefined;

    if (logoUrl.startsWith('http')) {
        try {
            // 🔒 FIX: Agregamos un timeout de 5 segundos para evitar que la petición se congele
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const res = await fetch(logoUrl, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!res.ok) return undefined;
            const arrayBuffer = await res.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            const contentType = res.headers.get('content-type') || 'image/png';
            return `data:${contentType};base64,${base64}`;
        } catch (e) {
            console.warn("Timeout o error al descargar el logo:", e);
            return undefined;
        }
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
            const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
            return `data:${mimeType};base64,${buffer.toString('base64')}`;
        }
    } catch (e) { }
    return undefined;
};

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const authResult = await authenticateAndLimit(session.user.id);
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    try {
        const { reservationId } = await req.json();
        if (!reservationId) return NextResponse.json({ error: 'Falta reservationId' }, { status: 400 });

        const reservation = await prisma.reservation.findUnique({
            where: { id: reservationId },
            include: {
                company: true, passenger: true, createdBy: { omit: { password: true } },
                departureFlights: { include: { flight: { include: { airline: true } } } },
                returnFlights: { include: { flight: { include: { airline: true } } } },
            }
        }) as any;

        if (!reservation) return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });

        // (Aquí ya estaba bien la validación de seguridad)
        if (reservation.companyId !== user.companyId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

        const safeQrString = await QRCode.toDataURL(`${process.env.NEXTAUTH_URL}/verify/${reservation.id}`, {
            margin: 1,
            width: 200
        });

        const logoBase64 = await getLogoAsBase64(reservation.company?.logoUrl);

        const pdfBuffer = await renderToBuffer(
            <InvoicePDF
                reservation={reservation}
                primaryColor={reservation.company?.primaryColor || "#3a486b"}
                secondaryColor={reservation.company?.secondaryColor || "#068ea1"}
                textColor={reservation.company?.textColor || "#363636"}
                qrDataUrl={safeQrString}
                logoDataUrl={logoBase64}
            />
        );

        const fileName = `invoices/invoice_${reservation.reservationCode}.pdf`;
        const publicUrl = await uploadFile(pdfBuffer, fileName, 'application/pdf');

        await prisma.reservation.update({
            where: { id: reservation.id },
            data: { pdfURL: publicUrl }
        });

        return NextResponse.json({ success: true, pdfURL: publicUrl });
    } catch (error: any) {
        console.error('Error actualizando PDF:', error);
        return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
    }
}