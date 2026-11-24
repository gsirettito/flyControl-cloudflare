import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '@/utils/prisma';
import { s3 } from '@/utils/minio';
import { InvoicePDF } from '@/components/InvoicePDF';
import QRCode from 'qrcode';
import { auth } from '@/auth';
import { authenticateAndLimit } from '@/utils/api/authenticateAndLimit';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }
        const userId = session.user.id;
        const isAdmin = session.user.isAdmin;

        // Rate limiting
        const authResult = await authenticateAndLimit(session.user.id);
        if (authResult instanceof NextResponse) return authResult;

        const company = await prisma.company.findUnique({
            where: {
                id: authResult.company.id
            }
        })

        const { reservationData } = await req.json();

        // 1. Obtener los datos completos de la reserva desde tu base de datos
        // (deberías hacer esto aquí en lugar de confiar en los datos del frontend)
        const reservation = await prisma.reservation.findUnique({
            where: { id: reservationData.id },
            include: {
                passenger: true,
                departureFlights: { include: { flight: true } },
                returnFlights: { include: { flight: true } },
                company: true,
                createdBy: { omit: { password: true } },
            }
        }) as any;

        if (!reservation)
            return NextResponse.json({ error: "" }, { status: 400 });

        const dataUrl = await QRCode.toDataURL(`${process.env.NEXTAUTH_URL}/verify/${reservation.id}`);
        
        // 2. Renderizar el PDF a un buffer
        const pdfBuffer = await renderToBuffer(
            <InvoicePDF reservation={reservation} primaryColor={company?.primaryColor || "#3a486b"} secondaryColor={company?.secondaryColor || "#068ea1"} textColor={company?.textColor || "#363636"} qrDataUrl={dataUrl} />
        );

        // 3. Subir el PDF a S3 (igual que en el ejemplo anterior)
        function generateCodigo() {
            let codigo = '';
            const digitos = '0123456789';
            for (let i = 0; i < 6; i++) {
                codigo += digitos.charAt(Math.floor(Math.random() * digitos.length));
            }
            return codigo;
        }
        const fileName = `invoices/invoice_${reservation.reservationCode}_${generateCodigo()}.pdf`;
        const uploadCommand = new PutObjectCommand({
            Bucket: process.env.BUCKET_MEDIA || 'flycontrol',
            Key: fileName,
            Body: pdfBuffer,
            ContentType: 'application/pdf',
        });
        await s3.send(uploadCommand);

        const publicUrl = `${process.env.MINIO_PUBLIC_URL}/${process.env.BUCKET_MEDIA || 'flycontrol'}/${fileName}`;
        return NextResponse.json({ success: true, url: publicUrl });

    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
