import { prisma } from './prisma';

export async function generateReservationCode(prefix: string): Promise<string> {
    // Buscar la última reserva con ese prefijo (orden descendente)
    const lastReservation = await prisma.reservation.findFirst({
        where: { reservationCode: { startsWith: prefix } },
        orderBy: { reservationCode: 'desc' },
        select: { reservationCode: true },
    });

    let nextNumber = 1;
    if (lastReservation) {
        const lastCode = lastReservation.reservationCode;
        const numberPart = lastCode.slice(prefix.length);
        const num = parseInt(numberPart, 10);
        if (!isNaN(num)) nextNumber = num + 1;
    }

    // Ajusta el padding a 6 dígitos (puedes cambiarlo)
    const padded = nextNumber.toString().padStart(6, '0');
    return `${prefix}${padded}`;
}

/**
 * Ejecuta `fn(code)` con un `reservationCode` único.
 * Si Prisma devuelve P2002 (código duplicado por concurrencia),
 * regenera el código y reintenta hasta `maxRetries` veces.
 *
 * Uso típico:
 *   const reserva = await withUniqueReservationCode(company.ticketPrefix,
 *       async (code) => prisma.$transaction(tx => tx.reservation.create({...}))
 *   );
 */
export async function withUniqueReservationCode<T>(
    prefix: string,
    fn: (code: string) => Promise<T>,
    maxRetries = 5,
): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const code = await generateReservationCode(prefix);
        try {
            return await fn(code);
        } catch (error: any) {
            // P2002 = Unique constraint failed
            const isDuplicate = error?.code === 'P2002';
            const isLastAttempt = attempt === maxRetries - 1;
            if (!isDuplicate || isLastAttempt) {
                throw error;
            }
            // Backoff pequeño + jitter para desincronizar requests concurrentes
            await new Promise((r) => setTimeout(r, 20 + Math.random() * 30));
        }
    }
    // Inalcanzable por el throw del loop, pero TS lo exige
    throw new Error('withUniqueReservationCode: reintentos agotados');
}