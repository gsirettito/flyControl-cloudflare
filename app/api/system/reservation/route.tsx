import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { buildWhere, buildOrderBy, buildGroupBy, getPrismaModel } from '@/utils/api/utils';
import { prisma } from '@/utils/prisma';
import { authenticateAndLimit } from '@/utils/api/authenticateAndLimit';
import { ReservationType, TripType } from '@/types/ModelsType';
import { getQuerySchema, updateBodySchema, deleteBodySchema } from '@/utils/api/schema';
import { withUniqueReservationCode } from '@/utils/reservationCode';
import { InvoicePDF } from '@/components/InvoicePDF';
import QRCode from 'qrcode';
import { renderToBuffer } from '@react-pdf/renderer';
import { sendEmail } from '@/utils/email';
import { loadEmailTemplate } from '@/utils/emailTemplate';
import { uploadFile } from '@/utils/storage';

const INVOICE_CURRENCIES = ['USD', 'EUR', 'MXN', 'COP'] as const;

// ============================================================
// GET - Listado de reservas con paginación y filtros
// ============================================================
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }
        const authResult = await authenticateAndLimit(session.user.id);
        if (authResult instanceof NextResponse) return authResult;
        const user = authResult;

        const companyId = (await prisma.user.findUnique({ where: { id: user.id }, select: { companyId: true } }))?.companyId as string;

        const prismaModel = getPrismaModel('Reservation');
        const url = new URL(req.url);
        const searchParams = url.searchParams;
        const query = Object.fromEntries(searchParams.entries());
        const validated = getQuerySchema.parse(query);
        const { page, limit } = validated;

        let where = buildWhere(searchParams);
        where = { ...where, companyId };

        const orderBy = buildOrderBy(searchParams);
        const groupByFields = buildGroupBy(searchParams);

        const selectFields = {
            id: true,
            reservationCode: true,
            tripType: true,
            passengerId: true,
            passenger: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    passportNumber: true,
                    phone: true,
                    nationality: true,
                    birthDate: true,
                    passportIssueDate: true,
                    passportExpiryDate: true,
                    type: true,
                    createdAt: true,
                },
            },
            createdByUserId: true,
            createdBy: {
                select: { name: true, email: true },
            },
            departureFlights: {
                select: {
                    flight: {
                        select: {
                            flightNumber: true,
                            origin: true,
                            originName: true,
                            originTimezone: true,
                            destination: true,
                            destinationName: true,
                            destinationTimezone: true,
                            departureTime: true,
                            arrivalTime: true,
                            createdAt: true,
                            availableSeats: true,
                            class: true,
                            airline: {
                                select: {
                                    displayName: true,
                                    iata: true,
                                    icao: true,
                                    logoUrl: true,
                                },
                            },
                        },
                    },
                },
            },
            returnFlights: {
                select: {
                    flight: {
                        select: {
                            id: true,
                            flightNumber: true,
                            origin: true,
                            originName: true,
                            originTimezone: true,
                            destination: true,
                            destinationName: true,
                            destinationTimezone: true,
                            departureTime: true,
                            arrivalTime: true,
                            createdAt: true,
                            availableSeats: true,
                            class: true,
                            airline: {
                                select: {
                                    displayName: true,
                                    iata: true,
                                    icao: true,
                                    logoUrl: true,
                                },
                            },
                        },
                    },
                },
            },
            baggage: true,
            invoiceAmount: true,
            invoiceCurrency: true,
            status: true,
            pnr: true,
            ticketNumber: true,
            pdfURL: true,
            createdAt: true,
            updatedAt: true,
        };

        if (groupByFields && groupByFields.length > 0) {
            const result = await (prismaModel as any).groupBy({
                by: groupByFields,
                where,
                _count: { _all: true },
                orderBy: orderBy || undefined,
                select: selectFields,
            });
            return NextResponse.json({ data: result, pagination: null });
        }

        const skip = (page - 1) * limit;
        const [data, total] = await prisma.$transaction([
            prismaModel.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                select: selectFields,
            }),
            prismaModel.count({ where }),
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
        console.error('Error en GET /api/reservation:', error);
        return NextResponse.json({ error: 'Error de consulta' }, { status: 400 });
    }
}

// ============================================================
// PUT - Actualizar reserva (solo campos permitidos)
// ============================================================
const updatableFields = ['status', 'pnr', 'ticketNumber', 'baggage', 'invoiceAmount', 'invoiceCurrency'] as const;
const updateSchema = {
    status: (val: string) => ['PENDING', 'CONFIRMED', 'REJECTED'].includes(val),
    pnr: () => true,
    ticketNumber: () => true,
    baggage: () => true,
    invoiceAmount: (val: number) => val >= 0,
    invoiceCurrency: (val: string) => (INVOICE_CURRENCIES as readonly string[]).includes(val),
};

export async function PUT(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();
    const authResult = await authenticateAndLimit(session.user.id);
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;
    if (!user.isAdmin && !user.isManager) return forbidden();

    try {
        const body = await req.json();
        const { id, data } = updateBodySchema.parse(body);
        if (!id) return badRequest('ID inválido');

        const existing = await prisma.reservation.findUnique({
            where: { id },
            select: { companyId: true, status: true },
        });
        if (!existing) return notFound('Reserva no encontrada');
        if (existing.companyId !== user.company.id) return forbidden();

        // 🔒 FIX Opcion 3: Bloquear transición a CONFIRMED por esta vía
        // Si la reserva no está confirmada y se intenta confirmar usando el PUT general,
        // se rechaza. Obligamos a usar el endpoint `/confirm` para que se generen
        // las notificaciones (Email, SMS) y se validen PNR/Ticket.
        if (data.status === 'CONFIRMED' && existing.status !== 'CONFIRMED') {
            return badRequest('Para confirmar una reserva, utilice el botón "Confirmar Reserva" en la interfaz. Ese proceso es necesario para generar el ticket, el PDF y enviar las notificaciones al pasajero.');
        }

        const allowedData: Record<string, any> = {};
        for (const key of Object.keys(data)) {
            if (!updatableFields.includes(key as any)) {
                return badRequest(`El campo "${key}" no puede ser actualizado`);
            }
            if (updateSchema[key as keyof typeof updateSchema]) {
                if (!updateSchema[key as keyof typeof updateSchema](data[key] as never)) {
                    return badRequest(`Valor inválido para el campo "${key}"`);
                }
            }
            allowedData[key] = data[key];
        }

        const updated = await prisma.reservation.update({
            where: { id },
            data: allowedData,
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error('Error en PUT /api/reservation:', error);
        return internalError(error);
    }
}

// ============================================================
// DELETE - Eliminar reserva (solo si está pendiente o cancelada)
// ============================================================
export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();
    const authResult = await authenticateAndLimit(session.user.id);
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;
    if (!user.isAdmin && !user.isManager) return forbidden();

    try {
        const body = await req.json();
        const { id } = deleteBodySchema.parse(body);
        if (!id) return badRequest('ID inválido');

        const reservation = await prisma.reservation.findUnique({
            where: { id },
            select: {
                id: true,
                companyId: true,
                status: true,
                reservationCode: true,
                passenger: true,
                departureFlights: {
                    select: { flight: true },
                },
                baggage: true,
                returnFlights: {
                    select: { flight: true },
                },
                company: true,
                tripType: true,
                pnr: true,
                ticketNumber: true,
                createdAt: true,
                createdBy: { omit: { password: true } },
            },
        }) as any;
        if (!reservation) return notFound('Reserva no encontrada');
        if (reservation.companyId !== user.company.id) return forbidden();

        if (reservation.status === 'CONFIRMED') {
            return badRequest('No se puede eliminar una reserva confirmada');
        }

        // Generar el PDF de la reservacion, guardar en el SR y en la reservacion
        try {
            const dataUrl = await QRCode.toDataURL(`${process.env.NEXTAUTH_URL}/verify/${reservation.id}`);
            const pdfBuffer = await renderToBuffer(
                <InvoicePDF
                    reservation={reservation}
                    primaryColor={reservation.company?.primaryColor || '#3a486b'}
                    secondaryColor={reservation.company?.secondaryColor || '#068ea1'}
                    textColor={reservation.company?.textColor || '#363636'}
                    qrDataUrl={dataUrl}
                />,
            );
            const fileName = `invoices/invoice_${reservation.reservationCode}.pdf`;

            const publicUrl = await uploadFile(pdfBuffer, fileName, 'application/pdf');

            await prisma.reservation.update({
                where: { id: reservation.id },
                data: { pdfURL: publicUrl },
            });
        } catch (e) {
            console.log('Error generando PDF:', e);
        }

        // Enviando correo
        const template_html = await loadEmailTemplate('reservation_delete', {
            reservation_code: reservation.reservationCode,
            full_name: reservation.passenger.fullName.toUpperCase(),
            nationality: reservation.passenger.nationality,
            passenger_phone: reservation.passenger.phone,
            flight_origin: (reservation.departureFlights ? reservation.departureFlights[0].flight?.origin : '-') as string,
            flight_destination: (reservation.departureFlights ? reservation.departureFlights[reservation.departureFlights.length - 1].flight?.destination : '-') as string,
            created_at: (new Date(reservation.createdAt)).toISOString(),
            tryp_type: reservation.tripType == 'ONE_WAY' ? 'Solo Ida' : 'Ida y Vuelta',
            tryp_pnr: reservation.pnr || '-',
            tryp_ticket: reservation.ticketNumber || '-',
            company_primary_color: reservation.company.primaryColor,
            company_secondary_color: reservation.company.secondaryColor,
        });
        const base_html = await loadEmailTemplate('base', {
            content: template_html,
            company_logo: reservation.company.logoUrl,
            company_name: reservation.company.commercialName,
            company_phone: reservation.company.phone,
            company_email: '',
            company_address: reservation.company.address,
            company_primary_color: reservation.company.primaryColor,
            company_secondary_color: reservation.company.secondaryColor,
        });
        /* const emailSent = await sendEmail({
            to: reservation.passenger.email as string,
            subject: `⚠️ Importante: Se ha cancelado la reserva de viaje.`,
            html: base_html,
        });
        if (!emailSent) {
            console.warn(`No se pudo enviar el email de notificacion`);
        } */

        await prisma.reservation.update({
            where: { id },
            data: { status: 'REJECTED' },
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error en DELETE /api/reservation:', error);
        if (error.code === 'P2025') return notFound('Reserva no encontrada');
        return internalError(error);
    }
}

// ============================================================
// POST - Crear Reserva
// ============================================================
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const authResult = await authenticateAndLimit(session.user.id);
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    try {
        const body = await req.json();

        const {
            tripType,
            departureFlights,
            returnFlights,
            passengerId,
            baggage,
            invoiceAmount,
            invoiceCurrency,
            status, pnr, ticketNumber,
            createInvoice,
        } = body;

        if (!passengerId) return badRequest('Falta passengerId');
        if (!departureFlights || departureFlights.length === 0) {
            return badRequest('Debe incluir al menos un vuelo de ida');
        }
        if (tripType === 'ROUND_TRIP' && (!returnFlights || returnFlights.length === 0)) {
            return badRequest('Viaje de ida y vuelta requiere al menos un vuelo de regreso');
        }

        if (invoiceAmount != null && (typeof invoiceAmount !== 'number' || invoiceAmount < 0)) {
            return badRequest('invoiceAmount inválido');
        }
        if (invoiceCurrency != null && !(INVOICE_CURRENCIES as readonly string[]).includes(invoiceCurrency)) {
            return badRequest('invoiceCurrency inválida');
        }

        const companyId = user.companyId;
        if (!companyId) return badRequest('El usuario no pertenece a ninguna compañía');

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: {
                logoUrl: true,
                ticketPrefix: true,
                primaryColor: true,
                secondaryColor: true,
                textColor: true,
                commercialName: true,
                phone: true,
                address: true,
            },
        });
        if (!company?.ticketPrefix) {
            return badRequest('La compañía no tiene prefijo de ticket configurado');
        }

        const passenger = await prisma.client.findUnique({
            where: { id: passengerId },
            select: { id: true, companyId: true },
        });
        if (!passenger) return notFound('Pasajero no encontrado');
        if (passenger.companyId !== companyId) {
            return badRequest('El pasajero no pertenece a tu compañía');
        }

        const departureFlightIds = departureFlights.map((f: any) => f.flightId);
        const departureFlightsData = await prisma.flight.findMany({
            where: { id: { in: departureFlightIds } },
            orderBy: { departureTime: 'asc' },
        });
        if (departureFlightsData.length !== departureFlightIds.length) {
            return badRequest('Alguno de los vuelos de ida no existe');
        }

        const invalidDeparture = departureFlightsData.find(
            (f) => f.companyId !== null && f.companyId !== companyId,
        );
        if (invalidDeparture) {
            return badRequest(`El vuelo ${invalidDeparture.flightNumber} no pertenece a tu compañía`);
        }

        let lastArrival: Date | null = null;
        for (const flight of departureFlightsData) {
            if (lastArrival && new Date(flight.departureTime) < lastArrival) {
                return badRequest(`El vuelo ${flight.flightNumber} sale antes de la llegada del vuelo anterior`);
            }
            lastArrival = new Date(flight.arrivalTime);
        }

        let returnFlightsData: any[] = [];
        if (returnFlights && returnFlights.length > 0) {
            const returnFlightIds = returnFlights.map((f: any) => f.flightId);
            returnFlightsData = await prisma.flight.findMany({
                where: { id: { in: returnFlightIds } },
                orderBy: { departureTime: 'asc' },
            });
            if (returnFlightsData.length !== returnFlightIds.length) {
                return badRequest('Alguno de los vuelos de regreso no existe');
            }

            const invalidReturn = returnFlightsData.find(
                (f) => f.companyId !== null && f.companyId !== companyId,
            );
            if (invalidReturn) {
                return badRequest(`El vuelo ${invalidReturn.flightNumber} no pertenece a tu compañía`);
            }

            lastArrival = null;
            for (const flight of returnFlightsData) {
                if (lastArrival && new Date(flight.departureTime) < lastArrival) {
                    return badRequest(`El vuelo de regreso ${flight.flightNumber} sale antes de la llegada del anterior`);
                }
                lastArrival = new Date(flight.arrivalTime);
            }
            const lastDepartureArrival = departureFlightsData[departureFlightsData.length - 1].arrivalTime;
            const firstReturnDeparture = returnFlightsData[0].departureTime;
            if (new Date(firstReturnDeparture) < new Date(lastDepartureArrival)) {
                return badRequest('El primer vuelo de regreso sale antes de la llegada del último vuelo de ida');
            }
        }

        const newReservation = await withUniqueReservationCode(company.ticketPrefix, async (reservationCode) => {
            return (await prisma.$transaction(async (tx) => {
                const reservation = await tx.reservation.create({
                    data: {
                        reservationCode,
                        tripType: tripType as TripType,
                        passengerId,
                        createdByUserId: user.id,
                        companyId,
                        baggage,
                        invoiceAmount: createInvoice && invoiceAmount ? Number(invoiceAmount) : null,
                        invoiceCurrency: createInvoice ? (invoiceCurrency || null) : null,
                        status: 'PENDING',
                        pnr: null,
                        ticketNumber: null,
                    },
                    include: {
                        passenger: true,
                    },
                });

                for (const flight of departureFlightsData) {
                    await tx.reservationDepartureFlight.create({
                        data: {
                            reservationId: reservation.id,
                            flightId: flight.id,
                        },
                    });
                }

                for (const flight of returnFlightsData) {
                    await tx.reservationReturnFlight.create({
                        data: {
                            reservationId: reservation.id,
                            flightId: flight.id,
                        },
                    });
                }

                // 3. 🔥 CREAR LA FACTURA SI EL CHECKBOX ESTÁ ACTIVO
                if (createInvoice && invoiceAmount > 0) {
                    // Generar número de factura (ej. FAC-000001)
                    const lastInvoice = await tx.invoice.findFirst({
                        where: { companyId },
                        orderBy: { invoiceNumber: 'desc' },
                        select: { invoiceNumber: true }
                    });
                    let nextNumber = 1;
                    if (lastInvoice) {
                        const numPart = lastInvoice.invoiceNumber.split('-')[1];
                        if (numPart) nextNumber = parseInt(numPart) + 1;
                    }
                    const newInvoiceNumber = `FAC-${nextNumber.toString().padStart(6, '0')}`;

                    await tx.invoice.create({
                        data: {
                            invoiceNumber: newInvoiceNumber,
                            companyId,
                            clientId: passengerId, // Se la facturamos al pasajero
                            currency: invoiceCurrency || 'USD',
                            totalAmount: Number(invoiceAmount),
                            status: 'PENDING',
                            items: {
                                create: [{
                                    description: `Vuelo - Reserva ${reservationCode}`,
                                    amount: Number(invoiceAmount),
                                    quantity: 1,
                                    reservationId: reservation.id // Vinculamos el ítem a la reserva
                                }]
                            }
                        }
                    });
                }

                return reservation;
            })) as ReservationType;
        });

        const reservation = await prisma.reservation.findUnique({
            where: { id: newReservation.id },
            include: {
                company: true,
                createdBy: { omit: { password: true } },
                departureFlights: { include: { flight: true } },
                returnFlights: { include: { flight: true } },
                passenger: true,
            },
        }) as any;

        let pdfBuffer: Buffer | null = null;
        try {
            const dataUrl = await QRCode.toDataURL(`${process.env.NEXTAUTH_URL}/verify/${reservation.id}`);
            pdfBuffer = await renderToBuffer(
                <InvoicePDF
                    reservation={reservation}
                    primaryColor={company?.primaryColor || '#3a486b'}
                    secondaryColor={company?.secondaryColor || '#068ea1'}
                    textColor={company?.textColor || '#363636'}
                    qrDataUrl={dataUrl}
                />,
            );

            const fileName = `invoices/invoice_${reservation.reservationCode}.pdf`;
            const publicUrl = await uploadFile(pdfBuffer, fileName, 'application/pdf');

            await prisma.reservation.update({
                where: { id: reservation.id },
                data: { pdfURL: publicUrl },
            });
        } catch (e) {
            console.log('Error generando PDF:', e);
        }

        if (reservation.passenger?.email != undefined) {
            const attachments = pdfBuffer
                ? [
                    {
                        filename: `reserva_${reservation.reservationCode}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf',
                    },
                ]
                : [];

            const template_html = await loadEmailTemplate('reservation_create', {
                reservation_code: reservation.reservationCode,
                full_name: reservation.passenger.fullName.toUpperCase(),
                nationality: reservation.passenger.nationality,
                passenger_phone: reservation.passenger.phone,
                flight_origin: (reservation.departureFlights ? reservation.departureFlights[0].flight?.origin : '-') as string,
                flight_destination: (reservation.departureFlights ? reservation.departureFlights[reservation.departureFlights.length - 1].flight?.destination : '-') as string,
                created_at: (new Date(reservation.createdAt)).toISOString(),
                tryp_type: reservation.tripType == 'ONE_WAY' ? 'Solo Ida' : 'Ida y Vuelta',
                company_primary_color: company.primaryColor,
                company_secondary_color: company.secondaryColor,
                url_view_details: `${process.env.NEXTAUTH_URL}/verify/${reservation.id}` || '',
            });
            const base_html = await loadEmailTemplate('base', {
                content: template_html,
                company_logo: company.logoUrl,
                company_name: company.commercialName,
                company_phone: company.phone,
                company_email: '',
                company_address: company.address,
                company_primary_color: company.primaryColor,
                company_secondary_color: company.secondaryColor,
            });
            /* const emailSent = await sendEmail({
                to: reservation.passenger.email as string,
                subject: `⚠️ Importante: Se ha creado la pre reserva de viaje.`,
                html: base_html,
                attachments
            });
            if (!emailSent) {
                console.warn(`No se pudo enviar el email de notificacion`);
            } */
        }

        return NextResponse.json(reservation, { status: 201 });
    } catch (error: any) {
        console.error('Error en POST /api/reservation:', error);
        return internalError(error);
    }
}

// ============================================================
// Funciones auxiliares
// ============================================================
function unauthorized() {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
}
function forbidden() {
    return NextResponse.json({ error: 'No tienes permisos para realizar esta acción' }, { status: 403 });
}
function badRequest(msg: string) {
    return NextResponse.json({ error: msg }, { status: 400 });
}
function notFound(msg: string) {
    return NextResponse.json({ error: msg }, { status: 404 });
}
function internalError(error: any) {
    const message = process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : error.message;
    return NextResponse.json({ error: message }, { status: 500 });
}