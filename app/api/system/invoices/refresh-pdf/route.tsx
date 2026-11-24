// app/api/system/invoices/refresh-pdf/route.tsx
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/utils/prisma';
import { authenticateAndLimit } from '@/utils/api/authenticateAndLimit';
import { renderToBuffer } from '@react-pdf/renderer';
import { FacturaPDF } from '@/components/FacturaPDF';
import { uploadFile } from '@/utils/storage';
import fs from 'fs';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import path from 'path';

// 🔥 Función para descargar el logo y convertirlo a Base64
const getLogoAsBase64 = async (logoUrl: string | null | undefined): Promise<string | undefined> => {
    if (!logoUrl) return undefined;
    if (logoUrl.startsWith('http')) {
        try {
            // Timeout de 5 segundos para evitar que la petición se congele
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
            console.warn("Error descargando logo:", e);
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
    if (!authResult.companyId) return NextResponse.json({ error: 'Sin compañía' }, { status: 403 });

    try {
        const { invoiceId } = await req.json();

        // Buscar la factura con los datos actualizados
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                company: true,
                client: true,
                items: {
                    include: {
                        reservation: true
                    }
                }
            }
        });

        if (!invoice || invoice.companyId !== authResult.companyId) {
            return NextResponse.json({ error: 'Factura no encontrada' }, { status: 403 });
        }

        // 🔥 Obtenemos el logo en Base64
        const logoDataUrl = await getLogoAsBase64(invoice.company.logoUrl);

        // Generar el PDF
        const pdfBuffer = await renderToBuffer(
            <FacturaPDF
                invoice={invoice}
                primaryColor={invoice.company.primaryColor}
                textColor={invoice.company.textColor || '#333333'}
                logoDataUrl={logoDataUrl}
            />
        );

        // Subir a MinIO/S3
        const fileName = `invoices/factura_${invoice.invoiceNumber}_v${Date.now()}.pdf`; // Añadimos timestamp para forzar descarga limpia
        const publicUrl = await uploadFile(pdfBuffer, fileName, 'application/pdf');

        // Guardar la nueva URL en la base de datos
        await prisma.invoice.update({
            where: { id: invoice.id },
            data: { pdfURL: publicUrl }
        });

        return NextResponse.json({ success: true, pdfURL: publicUrl });
    } catch (error: any) {
        console.error('Error generando PDF:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}