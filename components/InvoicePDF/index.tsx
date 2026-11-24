import { Document, Page, Image, Font, View, Svg, Path } from '@react-pdf/renderer';
import { formatInTimeZone } from 'date-fns-tz';
import { ReservationType } from '@/types/ModelsType';
import { FlexPDF, StackPDF, TextPDF } from '../PDFComponents';
import path from 'path'; // 🔥 'path' es seguro, Next.js lo adapta para el navegador

// 🔥 SOLUCIÓN: Diferenciar la ruta según el entorno
const getFontSrc = (filename: string) => {
    if (typeof window === 'undefined') {
        // En el servidor (Node.js), necesitamos la ruta absoluta en el disco
        return path.join(process.cwd(), 'public', 'fonts', filename);
    }
    // En el navegador (Cliente), usamos la ruta URL pública para que la descargue
    return `/fonts/${filename}`;
};

// 1. Registro de Fuentes
Font.register({
    family: 'Open Sans',
    fonts: [
        { src: getFontSrc('open-sans-regular.ttf') },
        { src: getFontSrc('open-sans-600.ttf'), fontWeight: 600 },
        { src: getFontSrc('open-sans-700.ttf'), fontWeight: 700 }
    ]
});

const formatBaggage = (bag: string | undefined | null) => {
    if (!bag) return 'No especificado';
    if (bag === 'SOLO_EQUIPAJE_MANO') return 'Solo equipaje de mano';
    if (bag === '1_MALETA_DOC') return '1 Maleta documentada (hasta 23kg)';
    if (bag === '2_MALETA_DOC') return '2 Maletas documentada (hasta 23kg c/u)';
    const formatted = bag.replace(/_/g, ' ').toLowerCase();
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

const formatDuration = (dep: Date, arr: Date) => {
    const diff = arr.getTime() - dep.getTime();
    if (diff < 0) return '0h 0m';
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
};

const PlaneIcon = ({ color }: { color: string }) => (
    <Svg width={14} height={14} viewBox="0 0 24 24">
        <Path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill={color} />
    </Svg>
);

export const InvoicePDF = ({
    reservation,
    primaryColor,
    secondaryColor,
    textColor,
    qrDataUrl,
    logoDataUrl,
}: {
    reservation: ReservationType;
    primaryColor: string;
    secondaryColor: string;
    textColor: string;
    qrDataUrl?: string | null;
    logoDataUrl?: string | null;
}) => {
    const {
        reservationCode, createdAt, tripType, passenger, pnr, ticketNumber,
        createdBy, departureFlights = [], returnFlights = [], company, baggage, status
    } = reservation;

    const allFlights = [
        ...departureFlights.map((f) => ({ ...f.flight, type: 'IDA' })),
        ...returnFlights.map((f) => ({ ...f.flight, type: 'REGRESO' })),
    ].filter(Boolean);

    const AGENCY_TIME_ZONE = 'America/Havana';
    const issueDate = formatInTimeZone(new Date(createdAt), AGENCY_TIME_ZONE, 'dd/MM/yyyy HH:mm');
    const birthDate = passenger?.birthDate ? formatInTimeZone(new Date(passenger.birthDate), AGENCY_TIME_ZONE, 'dd/MM/yyyy') : 'N/A';
    const displayPNR = pnr || reservationCode;
    const baggageText = formatBaggage(baggage);

    const bgLight = '#f8fafc';
    const borderColor = '#e2e8f0';
    const textMuted = '#64748b';
    const statusColor = status === 'CONFIRMED' ? '#16a34a' : '#f59e0b';
    const statusText = status === 'CONFIRMED' ? 'CONFIRMADO' : 'PRE-RESERVA';

    return (
        <Document>
            {/* ================= PÁGINA 1: BOLETO E ITINERARIO ================= */}
            <Page size="LETTER" style={{ padding: 35, fontFamily: 'Open Sans', fontSize: 9, backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column' }}>
                <StackPDF flex={1} gap={16}>

                    {/* BLOQUE SUPERIOR */}
                    <FlexPDF justify="space-between" align="center" bg={bgLight} style={{ padding: 16, borderRadius: 8, border: `1px solid ${borderColor}` }}>
                        <StackPDF gap={6} style={{ maxWidth: '40%' }}>
                            {logoDataUrl && typeof logoDataUrl === 'string' && logoDataUrl.length > 0 ? (
                                <Image style={{ width: '180px', maxHeight: 70, objectFit: 'contain', alignSelf: 'flex-start' }} src={logoDataUrl} />
                            ) : (
                                <TextPDF fontSize={22} bold color={primaryColor}>{company?.commercialName || 'FlyControl'}</TextPDF>
                            )}
                            <TextPDF fontSize={9} color={textMuted} style={{ letterSpacing: 1, marginTop: 4 }}>BOLETO ELECTRÓNICO / E-TICKET</TextPDF>
                        </StackPDF>

                        <FlexPDF gap={24} align="center">
                            <StackPDF gap={2}>
                                <StackPDF gap={0}>
                                    <TextPDF fontSize={7} color={textMuted} style={{ textTransform: 'uppercase', letterSpacing: 1 }}>Código de Reserva (PNR)</TextPDF>
                                    <TextPDF fontSize={16} bold color={primaryColor}>{displayPNR}</TextPDF>
                                </StackPDF>
                                <StackPDF gap={0}>
                                    <TextPDF fontSize={7} color={textMuted} style={{ textTransform: 'uppercase', letterSpacing: 1 }}>Número de Ticket</TextPDF>
                                    <TextPDF fontSize={10} bold color={textColor}>{ticketNumber || 'Pendiente'}</TextPDF>
                                </StackPDF>
                                <StackPDF gap={0}>
                                    <TextPDF fontSize={7} color={textMuted} style={{ textTransform: 'uppercase', letterSpacing: 1 }}>Estado</TextPDF>
                                    <View style={{ backgroundColor: `${statusColor}20`, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4, alignSelf: 'flex-start', marginTop: 2 }}>
                                        <TextPDF fontSize={8} bold color={statusColor}>{statusText}</TextPDF>
                                    </View>
                                </StackPDF>
                            </StackPDF>

                            {qrDataUrl && typeof qrDataUrl === 'string' && qrDataUrl.length > 0 && (
                                <View style={{ backgroundColor: '#fff', padding: 4, borderRadius: 6, border: `1px solid ${borderColor}` }}>
                                    <Image src={qrDataUrl} style={{ width: 70, height: 70 }} />
                                </View>
                            )}
                        </FlexPDF>
                    </FlexPDF>

                    {/* PASAJERO Y VIAJE */}
                    <FlexPDF gap={20} style={{ marginTop: 0 }}>
                        <StackPDF flex={1} gap={4}>
                            <TextPDF fontSize={10} bold color={primaryColor} style={{ borderBottom: `2px solid ${borderColor}`, paddingBottom: 2, marginBottom: 2, textTransform: 'uppercase' }}>Datos del Pasajero</TextPDF>
                            <TextPDF fontSize={12} bold color={textColor} style={{ marginBottom: 2 }}>{passenger?.fullName?.toUpperCase()}</TextPDF>
                            <FlexPDF gap={4}><TextPDF fontSize={8} color={textMuted} style={{ width: 60 }}>Nacionalidad:</TextPDF><TextPDF fontSize={8} color={textColor}>{passenger?.nationality}</TextPDF></FlexPDF>
                            <FlexPDF gap={4}><TextPDF fontSize={8} color={textMuted} style={{ width: 60 }}>Nacimiento:</TextPDF><TextPDF fontSize={8} color={textColor}>{birthDate}</TextPDF></FlexPDF>
                            <FlexPDF gap={4}><TextPDF fontSize={8} color={textMuted} style={{ width: 60 }}>Contacto:</TextPDF><TextPDF fontSize={8} color={textColor}>{passenger?.phone}</TextPDF></FlexPDF>
                        </StackPDF>
                        <StackPDF flex={1} gap={4}>
                            <TextPDF fontSize={10} bold color={primaryColor} style={{ borderBottom: `2px solid ${borderColor}`, paddingBottom: 2, marginBottom: 2, textTransform: 'uppercase' }}>Detalles del Viaje</TextPDF>
                            <FlexPDF gap={4}><TextPDF fontSize={8} color={textMuted} style={{ width: 70 }}>Emisión:</TextPDF><TextPDF fontSize={8} color={textColor}>{issueDate}</TextPDF></FlexPDF>
                            <FlexPDF gap={4}><TextPDF fontSize={8} color={textMuted} style={{ width: 70 }}>Tipo de Viaje:</TextPDF><TextPDF fontSize={8} bold color={textColor}>{tripType === 'ONE_WAY' ? 'Solo Ida' : 'Ida y Vuelta'}</TextPDF></FlexPDF>
                            <FlexPDF gap={4}><TextPDF fontSize={8} color={textMuted} style={{ width: 70 }}>Referencia:</TextPDF><TextPDF fontSize={8} color={textColor}>{reservationCode}</TextPDF></FlexPDF>
                            <FlexPDF gap={4}><TextPDF fontSize={8} color={textMuted} style={{ width: 70 }}>Agente:</TextPDF><TextPDF fontSize={8} color={textColor}>{createdBy?.name || 'Sistema'}</TextPDF></FlexPDF>
                        </StackPDF>
                    </FlexPDF>

                    {/* ITINERARIO COMPACTO */}
                    <StackPDF gap={6} style={{ marginTop: 4 }}>
                        <TextPDF fontSize={11} bold color={primaryColor} style={{ textTransform: 'uppercase', letterSpacing: 1 }}>Itinerario de Vuelos</TextPDF>
                        {allFlights.map((flight, idx) => {
                            const depDate = new Date(flight?.departureTime || '');
                            const arrDate = new Date(flight.arrivalTime || '');
                            const duration = formatDuration(depDate, arrDate);

                            return (
                                <View
                                    key={idx}
                                    wrap={false}
                                    style={{
                                        border: `1px solid ${borderColor}`,
                                        borderRadius: 6,
                                        padding: 0,
                                        backgroundColor: '#ffffff',
                                        overflow: 'hidden',
                                        marginBottom: 6
                                    }}
                                >
                                    <FlexPDF justify="space-between" align="center" style={{ backgroundColor: bgLight, padding: '4px 8px', borderBottom: `1px dashed ${borderColor}` }}>
                                        <TextPDF fontSize={8} bold color={secondaryColor}>{flight.type === 'IDA' ? 'VUELO DE IDA' : 'VUELO DE REGRESO'}</TextPDF>
                                        <TextPDF fontSize={8} bold color={textColor}>{flight.airline?.displayName || 'Aerolínea'} | {flight.flightNumber}</TextPDF>
                                    </FlexPDF>
                                    <View style={{ padding: '8px 10px' }}>
                                        <FlexPDF justify="space-between" align="center">
                                            <StackPDF gap={1} style={{ width: '30%' }}>
                                                <TextPDF fontSize={18} bold color={textColor}>{flight.origin}</TextPDF>
                                                <TextPDF fontSize={10} bold color={primaryColor}>{formatInTimeZone(depDate, flight.originTimezone || 'UTC', 'HH:mm')}</TextPDF>
                                                <TextPDF fontSize={7} color={textMuted}>{formatInTimeZone(depDate, flight.originTimezone || 'UTC', 'dd MMM, yyyy')}</TextPDF>
                                                <TextPDF fontSize={6} color={textMuted} style={{ marginTop: 1 }}>{flight.originName}</TextPDF>
                                            </StackPDF>
                                            <StackPDF align="center" gap={2} style={{ width: '40%' }}>
                                                <TextPDF fontSize={7} color={textMuted}>{duration}</TextPDF>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 5 }}>
                                                    <View style={{ flex: 1, height: 1, borderTop: `1px dashed ${textMuted}` }} />
                                                    <View style={{ marginHorizontal: 6 }}><PlaneIcon color={secondaryColor} /></View>
                                                    <View style={{ flex: 1, height: 1, borderTop: `1px dashed ${textMuted}` }} />
                                                </View>
                                                <TextPDF fontSize={6} color={textMuted}>Clase: {flight.class}</TextPDF>
                                            </StackPDF>
                                            <StackPDF align="flex-end" gap={1} style={{ width: '30%' }}>
                                                <TextPDF fontSize={18} bold color={textColor}>{flight.destination}</TextPDF>
                                                <TextPDF fontSize={10} bold color={primaryColor}>{formatInTimeZone(arrDate, flight.destinationTimezone || 'UTC', 'HH:mm')}</TextPDF>
                                                <TextPDF fontSize={7} color={textMuted}>{formatInTimeZone(arrDate, flight.destinationTimezone || 'UTC', 'dd MMM, yyyy')}</TextPDF>
                                                <TextPDF fontSize={6} color={textMuted} style={{ marginTop: 1, textAlign: 'right' }}>{flight.destinationName}</TextPDF>
                                            </StackPDF>
                                        </FlexPDF>
                                    </View>
                                </View>
                            );
                        })}
                    </StackPDF>

                    {/* EQUIPAJE Y CONDICIONES BÁSICAS */}
                    <FlexPDF gap={12} style={{ marginTop: 4 }}>
                        <StackPDF flex={1} bg={bgLight} style={{ padding: 8, borderRadius: 6, border: `1px solid ${borderColor}` }}>
                            <TextPDF fontSize={8} bold color={primaryColor} style={{ marginBottom: 4, textTransform: 'uppercase' }}>Equipaje Incluido</TextPDF>
                            <FlexPDF gap={4} align="center">
                                <View style={{ width: 6, height: 6, backgroundColor: secondaryColor, borderRadius: 3 }} />
                                <TextPDF fontSize={8} bold color={textColor}>{baggageText}</TextPDF>
                            </FlexPDF>
                        </StackPDF>
                        <StackPDF flex={1} bg={bgLight} style={{ padding: 8, borderRadius: 6, border: `1px solid ${borderColor}` }}>
                            <TextPDF fontSize={8} bold color={primaryColor} style={{ marginBottom: 2, textTransform: 'uppercase' }}>Condiciones</TextPDF>
                            <TextPDF fontSize={6.5} color={textMuted} style={{ marginBottom: 1 }}>• Preséntese 3 horas antes.</TextPDF>
                            <TextPDF fontSize={6.5} color={textMuted} style={{ marginBottom: 1 }}>• Documentos vigentes.</TextPDF>
                            <TextPDF fontSize={6.5} color={textMuted}>• Horarios sujetos a cambios.</TextPDF>
                        </StackPDF>
                    </FlexPDF>
                </StackPDF>
            </Page>

            {/* ================= PÁGINA 2: TÉRMINOS Y CONDICIONES ================= */}
            <Page size="LETTER" style={{ padding: 35, paddingBottom: 120, fontFamily: 'Open Sans', backgroundColor: '#ffffff' }}>
                <StackPDF gap={16}>
                    <TextPDF fontSize={14} bold color={primaryColor} style={{ textTransform: 'uppercase', borderBottom: `2px solid ${borderColor}`, paddingBottom: 6 }}>
                        Términos y Condiciones Legales
                    </TextPDF>

                    <StackPDF gap={12}>
                        <View>
                            <TextPDF fontSize={9} bold color={textColor} style={{ marginBottom: 4 }}>1. Documentación y Requisitos de Viaje</TextPDF>
                            <TextPDF fontSize={8} color={textMuted} style={{ lineHeight: 1.4 }}>
                                Es responsabilidad exclusiva del pasajero portar un pasaporte válido, así como las visas, permisos de tránsito y cualquier otro documento migratorio exigido por las autoridades de los países de origen, destino y escalas. La agencia no se hace responsable de la denegación de embarque o entrada a un país por falta de documentación en regla.
                            </TextPDF>
                        </View>

                        <View>
                            <TextPDF fontSize={9} bold color={textColor} style={{ marginBottom: 4 }}>2. Presentación en el Aeropuerto</TextPDF>
                            <TextPDF fontSize={8} color={textMuted} style={{ lineHeight: 1.4 }}>
                                El pasajero debe presentarse en el mostrador de facturación de la aerolínea con un mínimo de tres (3) horas de antelación para vuelos internacionales y dos (2) horas para vuelos nacionales. El incumplimiento de este requisito puede resultar en la pérdida de la reserva sin derecho a reembolso.
                            </TextPDF>
                        </View>

                        <View>
                            <TextPDF fontSize={9} bold color={textColor} style={{ marginBottom: 4 }}>3. Equipaje</TextPDF>
                            <TextPDF fontSize={8} color={textMuted} style={{ lineHeight: 1.4 }}>
                                Las franquicias de equipaje (mano y documentado) están estrictamente sujetas a las políticas de la aerolínea operadora. El pasajero es responsable del peso, dimensiones y contenido de sus pertenencias. Los artículos de valor deben transportarse en el equipaje de mano.
                            </TextPDF>
                        </View>

                        <View>
                            <TextPDF fontSize={9} bold color={textColor} style={{ marginBottom: 4 }}>4. Cambios, Cancelaciones y Reembolsos</TextPDF>
                            <TextPDF fontSize={8} color={textMuted} style={{ lineHeight: 1.4 }}>
                                Cualquier modificación o cancelación de la reserva está sujeta a las penalizaciones y condiciones tarifarias de la aerolínea. Las tasas de servicio de la agencia no son reembolsables. Los reembolsos (si aplican) se procesarán según los tiempos estipulados por la aerolínea.
                            </TextPDF>
                        </View>

                        <View>
                            <TextPDF fontSize={9} bold color={textColor} style={{ marginBottom: 4 }}>5. Itinerarios y Horarios</TextPDF>
                            <TextPDF fontSize={8} color={textMuted} style={{ lineHeight: 1.4 }}>
                                Los horarios de vuelo indicados en este documento están sujetos a cambios sin previo aviso por parte de la aerolínea. La agencia recomienda verificar el estado del vuelo directamente con la aerolínea 24 horas antes de la salida.
                            </TextPDF>
                        </View>
                    </StackPDF>
                </StackPDF>

                {/* FOOTER DE LA EMPRESA */}
                <View style={{ position: 'absolute', bottom: 35, left: 35, right: 35, borderTop: `1px solid ${borderColor}`, paddingTop: 15 }}>
                    <StackPDF align="center" gap={3}>
                        {logoDataUrl && typeof logoDataUrl === 'string' && logoDataUrl.length > 0 && (
                            <Image style={{ width: '80px', maxHeight: 40, objectFit: 'contain', marginBottom: 2 }} src={logoDataUrl} />
                        )}
                        <TextPDF fontSize={9} bold color={textColor}>{company?.commercialName}</TextPDF>
                        <TextPDF fontSize={7.5} color={textMuted}>{company?.address}</TextPDF>
                        <TextPDF fontSize={7.5} color={textMuted}>Tel: {company?.phone} | Email: {company?.email || 'soporte@flycontrol.com'}</TextPDF>
                        <TextPDF fontSize={6.5} color={textMuted} style={{ marginTop: 4 }}>Documento generado por FlyControl</TextPDF>
                    </StackPDF>
                </View>
            </Page>
        </Document>
    );
};