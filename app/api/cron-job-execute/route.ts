import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/utils/prisma';
import { sendEmail } from '@/utils/email';
import { loadEmailTemplate } from '@/utils/emailTemplate';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { timingSafeEqual } from 'node:crypto';

dayjs.extend(utc);

function authorized(header: string | null, token: string): boolean {
    const actual = Buffer.from(header ?? '');
    const expected = Buffer.from(`Bearer ${token}`);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function POST(req: NextRequest) {
    const token = process.env.CRON_SECRET_TOKEN;
    if (!token?.trim()) {
        console.error('[CRON] Token no configurado');
        return NextResponse.json({ error: 'Cron unavailable' }, { status: 503 });
    }
    if (!authorized(req.headers.get('authorization'), token)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const now = dayjs.utc();
    let expiredCount = 0, remindersSent = 0, failures = 0;
    try {
        // Lectura inicial ligera; se cargan detalles solo para candidatas a aviso o expiración.
        // No se presupone un máximo de horas de expiración en el esquema.
        const pending = await prisma.reservation.findMany({
            where: { status: 'PENDING' },
            select: { id: true, createdAt: true, company: { select: { preReservationExpiryHours: true } } },
        });
        for (const candidate of pending) {
            const expiry = dayjs.utc(candidate.createdAt).add(candidate.company?.preReservationExpiryHours ?? 24, 'hour');
            if (now.isBefore(expiry.subtract(4, 'hour'))) continue;
            try {
                const cancelled = await prisma.$transaction(async tx => {
                    const [lock] = await tx.$queryRaw<{ locked: boolean }[]>`SELECT pg_try_advisory_xact_lock(hashtextextended(${`flycontrol:pending:${candidate.id}`}, 0)) AS locked`;
                    if (!lock?.locked) return null;
                    const r = await tx.reservation.findUnique({
                        where: { id: candidate.id },
                        include: { company: true, passenger: true, departureFlights: { include: { flight: true }, orderBy: { flight: { departureTime: 'asc' } } } },
                    });
                    if (!r || r.status !== 'PENDING') return null;
                    const expires = dayjs.utc(r.createdAt).add(r.company?.preReservationExpiryHours ?? 24, 'hour');
                    if (!now.isBefore(expires)) {
                        const changed = await tx.reservation.updateMany({ where: { id: r.id, status: 'PENDING' }, data: { status: 'REJECTED' } });
                        if (!changed.count) return null;
                        await tx.notification.create({ data: {
                            userId: r.createdByUserId, companyId: r.companyId,
                            title: 'Pre-reserva Expirada', message: `La reserva ${r.reservationCode} ha expirado y fue cancelada automáticamente.`,
                            type: 'ERROR', link: '/reservations/list',
                        } });
                        return r;
                    }
                    if (!now.isBefore(expires.subtract(4, 'hour'))) {
                        const message = `La reserva ${r.reservationCode} expirará en menos de 4 horas. Confírmala pronto.`;
                        const existing = await tx.notification.findFirst({ where: {
                            companyId: r.companyId, userId: r.createdByUserId, title: 'Pre-reserva por Expirar', message,
                            createdAt: { gte: now.subtract(12, 'hour').toDate() },
                        } });
                        if (!existing) await tx.notification.create({ data: {
                            userId: r.createdByUserId, companyId: r.companyId, title: 'Pre-reserva por Expirar', message,
                            type: 'WARNING', link: '/reservations/list',
                        } });
                    }
                    return null;
                });
                if (!cancelled) continue;
                expiredCount++;
                const r = cancelled;
                if (!r.passenger?.email || !r.company) continue;
                try {
                    const content = await loadEmailTemplate('reservation_delete', {
                        reservation_code: r.reservationCode, full_name: r.passenger.fullName.toUpperCase(),
                        nationality: r.passenger.nationality, passenger_phone: r.passenger.phone,
                        flight_origin: r.departureFlights[0]?.flight?.origin ?? '-',
                        flight_destination: r.departureFlights[r.departureFlights.length - 1]?.flight?.destination ?? '-',
                        created_at: r.createdAt.toISOString(), tryp_type: r.tripType === 'ONE_WAY' ? 'Solo Ida' : 'Ida y Vuelta',
                        tryp_pnr: r.pnr || '-', tryp_ticket: r.ticketNumber || '-',
                        company_primary_color: r.company.primaryColor, company_secondary_color: r.company.secondaryColor,
                    });
                    const html = await loadEmailTemplate('base', {
                        content, company_logo: r.company.logoUrl, company_name: r.company.commercialName,
                        company_phone: r.company.phone, company_email: '', company_address: r.company.address,
                        company_primary_color: r.company.primaryColor, company_secondary_color: r.company.secondaryColor,
                    });
                    if (!await sendEmail({ to: r.passenger.email, subject: '⚠️ Importante: Se ha cancelado la reserva de viaje.', html })) throw new Error('Email failed');
                } catch { failures++; console.error('[CRON] Falló correo de cancelación'); }
            } catch { failures++; console.error('[CRON] Falló procesamiento de pre-reserva'); }
        }
        const hidden = await prisma.flight.updateMany({
            where: { departureTime: { lt: now.toDate() }, isVisible: true }, data: { isVisible: false },
        });

        // Ventanas de recuperación: si el cron se retrasa, no se pierde el aviso.
        // Si faltan <=4h se prioriza ese aviso y no se envía uno tardío de 24h.
        const limit24 = now.add(24, 'hour').toDate();
        const limit4 = now.add(4, 'hour').toDate();
        const upcoming = await prisma.reservation.findMany({
            where: {
                status: 'CONFIRMED', company: { notifyFlightReminders: true },
                OR: [{ sent24hReminder: false }, { sent4hReminder: false }],
                departureFlights: { some: { flight: { departureTime: { gt: now.toDate(), lte: limit24 } } } },
            }, select: { id: true },
        });
        for (const candidate of upcoming) {
            try {
                const sent = await prisma.$transaction(async tx => {
                    const [lock] = await tx.$queryRaw<{ locked: boolean }[]>`SELECT pg_try_advisory_xact_lock(hashtextextended(${`flycontrol:reminder:${candidate.id}`}, 0)) AS locked`;
                    if (!lock?.locked) return false;
                    const r = await tx.reservation.findUnique({ where: { id: candidate.id }, include: {
                        passenger: true, company: true,
                        departureFlights: { include: { flight: true }, orderBy: { flight: { departureTime: 'asc' } } },
                    } });
                    if (!r || r.status !== 'CONFIRMED' || !r.company?.notifyFlightReminders || !r.passenger?.email) return false;
                    const f = r.departureFlights[0]?.flight;
                    if (!f || f.departureTime <= now.toDate() || f.departureTime > limit24) return false;
                    const is4 = f.departureTime <= limit4;
                    if (is4 ? r.sent4hReminder : r.sent24hReminder) return false;
                    const minutes = Math.max(1, Math.ceil((f.departureTime.getTime() - now.valueOf()) / 60000));
                    const timeLeftText = `${Math.floor(minutes / 60)} h ${minutes % 60} min aprox.`;
                    const content = await loadEmailTemplate('flight_reminder', {
                        passenger_name: r.passenger.fullName.toUpperCase(), time_left: timeLeftText,
                        flight_number: f.flightNumber, origin: `${f.origin} (${f.originName})`,
                        destination: `${f.destination} (${f.destinationName})`,
                        departure_time: `${dayjs.utc(f.departureTime).format('DD/MM/YYYY HH:mm')} UTC`,
                        company_name: r.company.commercialName, company_logo: r.company.logoUrl,
                        company_primary_color: r.company.primaryColor, company_phone: r.company.phone,
                    });
                    const html = await loadEmailTemplate('base', {
                        content, company_logo: r.company.logoUrl, company_name: r.company.commercialName,
                        company_phone: r.company.phone, company_email: '', company_address: r.company.address,
                        company_primary_color: r.company.primaryColor, company_secondary_color: r.company.secondaryColor,
                    });
                    // La transacción y el bloqueo reducen duplicados concurrentes.
                    // El envío externo no es atómico con PostgreSQL.
                    const changed = await tx.reservation.updateMany({
                        where: { id: r.id, status: 'CONFIRMED', ...(is4 ? { sent4hReminder: false } : { sent24hReminder: false }) },
                        data: is4 ? { sent4hReminder: true } : { sent24hReminder: true },
                    });
                    if (!changed.count) return false;
                    if (!await sendEmail({ to: r.passenger.email, subject: `✈️ Recordatorio de vuelo: Sale en ${timeLeftText}`, html })) throw new Error('Email failed');
                    return true;
                }, { timeout: 30000 });
                if (sent) remindersSent++;
            } catch { failures++; console.error('[CRON] Falló recordatorio'); }
        }
        return NextResponse.json({ success: failures === 0, expiredReservations: expiredCount, hiddenFlights: hidden.count, remindersSent, failures }, { status: failures ? 500 : 200 });
    } catch {
        console.error('[CRON] Error crítico');
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
