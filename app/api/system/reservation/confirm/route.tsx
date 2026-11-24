import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/utils/prisma';
import { authenticateAndLimit } from '@/utils/api/authenticateAndLimit';
import { sendEmail } from '@/utils/email';
import { sendSMS } from '@/utils/sms';
import { loadEmailTemplate } from '@/utils/emailTemplate';
import QRCode from 'qrcode';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoicePDF } from '@/components/InvoicePDF';
import { uploadFile } from '@/utils/storage';

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const authResult = await authenticateAndLimit(session.user.id);
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;
    if (!user.isAdmin) {
        return NextResponse.json({ error: 'No tienes permisos para confirmar reservas' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { reservationId, pnr, ticketNumber } = body;

        if (!reservationId) {
            return NextResponse.json({ error: 'Falta reservationId' }, { status: 400 });
        }
        if (!pnr?.trim()) {
            return NextResponse.json({ error: 'El campo PNR es obligatorio' }, { status: 400 });
        }
        if (!ticketNumber?.trim()) {
            return NextResponse.json({ error: 'El campo número de ticket es obligatorio' }, { status: 400 });
        }

        // Verificar existencia y permisos
        const existing = await prisma.reservation.findUnique({
            where: { id: reservationId },
            select: { companyId: true, status: true, reservationCode: true, passengerId: true },
        });
        if (!existing) {
            return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
        }
        if (existing.companyId !== user.companyId) {
            return NextResponse.json({ error: 'No autorizado para esta reserva' }, { status: 403 });
        }
        if (existing.status === 'CONFIRMED') {
            return NextResponse.json({ error: 'La reserva ya está confirmada' }, { status: 400 });
        }

        // Actualizar reserva
        const updated = await prisma.reservation.update({
            where: { id: reservationId },
            data: {
                status: 'CONFIRMED',
                pnr: pnr.trim(),
                ticketNumber: ticketNumber.trim(),
            },
            select: {
                id: true,
                reservationCode: true,
                // 🔒 FIX Bug 1: agregados los escalares que el código usa más abajo.
                // Sin esto, updated.createdByUserId y updated.companyId son undefined
                // y prisma.notification.create falla con error de validación.
                createdByUserId: true,
                companyId: true,
                passenger: true,
                departureFlights: {
                    select: {
                        flight: true,
                    },
                },
                returnFlights: {
                    select: {
                        flight: true,
                    },
                },
                company: true,
                tripType: true,
                pnr: true,
                ticketNumber: true,
                createdAt: true,
                createdBy: { omit: { password: true } },
                baggage: true,
            },
        }) as any;

        const company = await prisma.company.findUnique({
            where: { id: user.company.id },
            select: {
                logoUrl: true,
                ticketPrefix: true,
                primaryColor: true,
                secondaryColor: true,
                textColor: true,
                commercialName: true,
                phone: true,
                address: true,
                notifySmsConfirm: true,
                notifyEmailConfirm: true,
                notifyManagerEmail: true,
            },
        });

        // Generar el PDF de la reservación, guardar en el SR y en la reservación
        let pdfBuffer: Buffer | null = null;
        try {
            const dataUrl = await QRCode.toDataURL(`${process.env.NEXTAUTH_URL}/verify/${updated.id}`);
            pdfBuffer = await renderToBuffer(
                <InvoicePDF
                    reservation={updated}
                    primaryColor={company?.primaryColor || '#3a486b'}
                    secondaryColor={company?.secondaryColor || '#068ea1'}
                    textColor={company?.textColor || '#363636'}
                    qrDataUrl={dataUrl}
                />,
            );

            const fileName = `invoices/invoice_${updated.reservationCode}.pdf`;
            const publicUrl = await uploadFile(pdfBuffer, fileName, 'application/pdf');

            await prisma.reservation.update({
                where: { id: updated.id },
                data: { pdfURL: publicUrl },
            });
        } catch (e) {
            console.log('Error generando PDF:', e);
        }

        // 🔒 FIX Bug 2: array plano. Cada push dispara el envío real (no anidado),
        // así Promise.allSettled espera TODOS los envíos antes de responder.
        const notificationsPromises: Promise<any>[] = [];

        // 1. Email al pasajero (si está activado)
        if (updated.passenger?.email && company?.notifyEmailConfirm) {
            notificationsPromises.push(
                (async () => {
                    try {
                        const attachments = pdfBuffer
                            ? [
                                {
                                    filename: `reserva_${updated.reservationCode}.pdf`,
                                    content: pdfBuffer,
                                    contentType: 'application/pdf',
                                },
                            ]
                            : [];

                        const template_html = await loadEmailTemplate('reservation_confirm', {
                            reservation_code: updated.reservationCode,
                            full_name: updated.passenger.fullName.toUpperCase(),
                            nationality: updated.passenger.nationality,
                            passenger_phone: updated.passenger.phone,
                            flight_origin: (updated.departureFlights ? updated.departureFlights[0].flight?.origin : '-') as string,
                            flight_destination: (updated.departureFlights ? updated.departureFlights[updated.departureFlights.length - 1].flight?.destination : '-') as string,
                            created_at: new Date(updated.createdAt).toISOString(),
                            tryp_type: updated.tripType == 'ONE_WAY' ? 'Solo Ida' : 'Ida y Vuelta',
                            tryp_pnr: updated.pnr || '-',
                            tryp_ticket: updated.ticketNumber || '-',
                            company_primary_color: updated.company.primaryColor,
                            company_secondary_color: updated.company.secondaryColor,
                            url_view_details: `${process.env.NEXTAUTH_URL}/verify/${updated.id}` || '',
                        });
                        const base_html = await loadEmailTemplate('base', {
                            content: template_html,
                            company_logo: updated.company.logoUrl,
                            company_name: updated.company.commercialName,
                            company_phone: updated.company.phone,
                            company_email: '',
                            company_address: updated.company.address,
                            company_primary_color: updated.company.primaryColor,
                            company_secondary_color: updated.company.secondaryColor,
                        });

                        const emailSent = await sendEmail({
                            to: updated.passenger.email as string,
                            subject: `⚠️ Importante: Se ha confirmado la reserva de viaje.`,
                            html: base_html,
                            attachments,
                        });

                        if (!emailSent) console.warn(`No se pudo enviar el email de notificacion`);
                    } catch (e) {
                        console.error('Error enviando email al pasajero:', e);
                    }
                })(),
            );
        }

        // 2. SMS al pasajero (si está activado)
        if (updated.passenger?.phone && company?.notifySmsConfirm) {
            notificationsPromises.push(
                (async () => {
                    try {
                        const smsMessage = `FlyControl: Su reserva ${updated.reservationCode} ha sido CONFIRMADA. PNR: ${updated.pnr}. Ticket: ${updated.ticketNumber}. Gracias por su compra.`;

                        const smsSent = await sendSMS({
                            to: updated.passenger.phone,
                            message: smsMessage,
                        });

                        if (!smsSent) {
                            console.warn(`No se pudo enviar el SMS al pasajero ${updated.passenger.phone}`);
                        }
                    } catch (e) {
                        console.error('Error enviando SMS al pasajero:', e);
                    }
                })(),
            );
        }

        // 3. Email al gestor (si está activado)
        if (company?.notifyManagerEmail) {
            notificationsPromises.push(
                (async () => {
                    try {
                        await sendEmail({
                            to: updated.createdBy?.email || user.email || '',
                            subject: `✅ Reserva Confirmada: ${updated.reservationCode}`,
                            html: `<p>Hola ${updated.createdBy?.name},</p><p>Has confirmado la reserva <b>${updated.reservationCode}</b> del pasajero <b>${updated.passenger?.fullName}</b>.</p><p>PNR: ${updated.pnr}</p>`,
                        });
                    } catch (e) {
                        console.error('Error enviando email al manager:', e);
                    }
                })(),
            );
        }

        // 4. Notificación in-app al creador (si no es el mismo que confirma).
        // 🔒 FIX Bug 1: ya no cae acá con createdByUserId undefined porque
        // lo agregamos al select. Y la envolvemos en try/catch propio para
        // que un fallo acá no devuelva 500 cuando la reserva ya está CONFIRMED.
        try {
            if (updated.createdByUserId !== user.id) {
                await prisma.notification.create({
                    data: {
                        userId: updated.createdByUserId,
                        companyId: updated.companyId,
                        title: 'Reserva Confirmada',
                        message: `El administrador ha confirmado la reserva ${updated.reservationCode}.`,
                        type: 'SUCCESS',
                        link: `/reservations/list?id=${updated.id}`,
                    },
                });
            }
        } catch (e) {
            console.error('Error creando notificación in-app:', e);
        }

        // Esperar todos los envíos antes de responder
        await Promise.allSettled(notificationsPromises);

        return NextResponse.json({ success: true, reservation: updated });
    } catch (error: any) {
        console.error('Error confirmando reserva:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}