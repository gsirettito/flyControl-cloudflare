// utils/bulkParser.ts
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

export type ParsedPassenger = {
    fullName: string;
    nationality: string;
    passportNumber: string;
    passportIssueDate?: Date;
    passportExpiryDate: Date;
    birthDate: Date;
    phone: string;
    email?: string;
    pnr?: string;
    ticketNumber?: string;
};

export type ParsedFlight = {
    flightNumber: string;
    origin: string;
    destination: string;
    departureTime: Date;
    arrivalTime: Date;
    class: 'ECONOMY' | 'BUSINESS' | 'FIRST';
    airlineIata: string;
    type: 'IDA' | 'REGRESO';
};

export type ParsedBulkData = {
    passengers: ParsedPassenger[];
    departureFlights: ParsedFlight[];
    returnFlights: ParsedFlight[];
    baggage: string;
};

const parseDate = (dateStr: string): Date => {
    const formats = [
        'YYYYMMDDHHmm', 'YYYY-MM-DD HH:mm', 'DD/MM/YYYY HH:mm',
        'YYYYMMDD', 'DD/MM/YYYY', 'YYYY-MM-DD'
    ];
    for (const format of formats) {
        const parsed = dayjs(dateStr, format, true);
        if (parsed.isValid()) return parsed.toDate();
    }
    const looseParsed = dayjs(dateStr);
    if (looseParsed.isValid()) return looseParsed.toDate();
    throw new Error(`Formato de fecha no reconocido: ${dateStr}`);
};

// 🔥 Función para traducir el equipaje
const translateBaggage = (bag: string) => {
    const lower = bag.toLowerCase().trim();
    if (lower === '1m') return '1 Maleta documentada';
    if (lower === '2m') return '2 aMaletas documentadas';
    if (lower === 'ee') return 'Equipaje especial';
    return bag; // Si escribe algo distinto, lo dejamos igual
};

export function parseBulkText(text: string): ParsedBulkData {
    const passengers: ParsedPassenger[] = [];
    const departureFlights: ParsedFlight[] = [];
    const returnFlights: ParsedFlight[] = [];

    let baggage = 'No especificado';
    let pnrs: string[] = [];
    let tickets: string[] = [];

    // 1. Extraer variables globales (PNR, TICKET, EQUIPAJE) usando Regex en todo el texto
    const pnrMatch = text.match(/PNR:\s*(.*)/i);
    if (pnrMatch) pnrs = pnrMatch[1].split(',').map(s => s.trim());

    const ticketMatch = text.match(/TICKET:\s*(.*)/i);
    if (ticketMatch) tickets = ticketMatch[1].split(',').map(s => s.trim());

    const bagMatch = text.match(/EQUIPAJE:\s*(.*)/i);
    if (bagMatch) baggage = translateBaggage(bagMatch[1]);

    // 2. Limpiamos el texto quitando esas líneas globales
    let cleanText = text
        .replace(/PNR:.*/ig, '')
        .replace(/TICKET:.*/ig, '')
        .replace(/EQUIPAJE:.*/ig, '');

    // 3. Procesar el resto por bloques (separados por doble salto de línea)
    const blocks = cleanText.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);

    for (const block of blocks) {
        // Si es un pasajero en formato largo
        if (block.includes('PASAJERO:')) {
            const extract = (key: string) => {
                const match = block.match(new RegExp(`${key}:\\s*(.*)`, 'i'));
                return match ? match[1].trim() : undefined;
            };
            passengers.push({
                fullName: extract('PASAJERO') || '',
                nationality: extract('NACIONALIDAD') || '',
                passportNumber: extract('PASAPORTE') || '',
                passportIssueDate: extract('PEMISION') ? parseDate(extract('PEMISION')!) : undefined,
                passportExpiryDate: parseDate(extract('PVENCE')!),
                birthDate: parseDate(extract('NACIMIENTO')!),
                phone: extract('TELEFONO') || '',
                email: extract('EMAIL'),
            });
            continue;
        }

        // Si es un vuelo en formato largo
        if (block.includes('VUELO IDA:') || block.includes('VUELO REGRESO:')) {
            const flightBlocks = block.split(/(?=VUELO IDA:|VUELO REGRESO:)/);
            for (const fb of flightBlocks) {
                if (!fb.trim()) continue;
                const isIda = fb.includes('VUELO IDA:');
                const extract = (key: string) => {
                    const match = fb.match(new RegExp(`${key}:\\s*(.*)`, 'i'));
                    return match ? match[1].trim() : undefined;
                };
                const flight: ParsedFlight = {
                    flightNumber: isIda ? extract('VUELO IDA')! : extract('VUELO REGRESO')!,
                    origin: extract('ORIGEN')!,
                    destination: extract('DESTINO')!,
                    departureTime: parseDate(extract('SALIDA')!),
                    arrivalTime: parseDate(extract('LLEGADA')!),
                    class: (extract('CLASE') || 'ECONOMY').toUpperCase() as any,
                    airlineIata: extract('AEROLÍNEA')!,
                    type: isIda ? 'IDA' : 'REGRESO'
                };
                isIda ? departureFlights.push(flight) : returnFlights.push(flight);
            }
            continue;
        }

        // Si es formato rápido (>> para pasajeros, >/< para vuelos)
        // Separamos el bloque por líneas simples
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        for (const line of lines) {
            if (line.startsWith('>>')) {
                const parts = line.split('>>').map(p => p.trim());
                passengers.push({
                    fullName: parts[1] || '',
                    nationality: parts[2] || '',
                    passportNumber: parts[3] || '',
                    passportIssueDate: parts[4] ? parseDate(parts[4]) : undefined,
                    passportExpiryDate: parseDate(parts[5]),
                    birthDate: parseDate(parts[6]),
                    phone: parts[7] || '',
                    email: parts[8] || undefined,
                });
            } else if (line.startsWith('>') || line.startsWith('<')) {
                const isIda = line.startsWith('>');
                const separator = isIda ? '>' : '<';
                const parts = line.split(separator).map(p => p.trim());

                const flight: ParsedFlight = {
                    flightNumber: parts[1],
                    origin: parts[2],
                    destination: parts[3],
                    departureTime: parseDate(parts[4]),
                    arrivalTime: parseDate(parts[5]),
                    class: (parts[6] || 'ECONOMY').toUpperCase() as any,
                    airlineIata: parts[7],
                    type: isIda ? 'IDA' : 'REGRESO'
                };
                isIda ? departureFlights.push(flight) : returnFlights.push(flight);
            }
        }
    }

    // Asignar PNR y Tickets a los pasajeros (por orden)
    passengers.forEach((p, index) => {
        if (pnrs[index]) p.pnr = pnrs[index];
        if (tickets[index]) p.ticketNumber = tickets[index];
    });

    return { passengers, departureFlights, returnFlights, baggage };
}