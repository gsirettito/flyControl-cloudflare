// components/FacturaPDF/index.tsx
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import path from 'path';
import { formatInTimeZone } from 'date-fns-tz';
import { StackPDF, TextPDF } from '../PDFComponents';
import { format } from 'date-fns';

// Registrar fuentes
const getFontSrc = (filename: string) => {
    if (typeof window === 'undefined') return path.join(process.cwd(), 'public', 'fonts', filename);
    return `/fonts/${filename}`;
};
Font.register({
    family: 'Open Sans',
    fonts: [
        { src: getFontSrc('open-sans-regular.ttf') },
        { src: getFontSrc('open-sans-600.ttf'), fontWeight: 600 },
        { src: getFontSrc('open-sans-700.ttf'), fontWeight: 700 }
    ]
});

// Estilos de la factura
const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Open Sans', fontSize: 10, color: '#333' },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
    companyInfo: { flexDirection: 'column', maxWidth: '50%' },
    companyName: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
    titleSection: { alignItems: 'flex-end' },
    title: { fontSize: 24, fontWeight: 700, color: '#000', marginBottom: 4 },
    invoiceNumber: { fontSize: 12, fontWeight: 600, marginBottom: 2 },
    date: { fontSize: 10, color: '#666' },
    sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 4 },
    table: { width: '100%', marginTop: 20 },
    tableHeader: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
    tableHeaderText: { fontWeight: 700, fontSize: 10 },
    tableRow: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
    colDescription: { flex: 4 },
    colQty: { flex: 1, textAlign: 'center' },
    colAmount: { flex: 1, textAlign: 'right' },
    colTotal: { flex: 1, textAlign: 'right' },
    totalsSection: { marginTop: 20, alignItems: 'flex-end' },
    totalRow: { flexDirection: 'row', justifyContent: 'flex-end', width: '50%', marginBottom: 4 },
    totalLabel: { fontWeight: 600, marginRight: 20 },
    totalValue: { fontWeight: 700, width: 80, textAlign: 'right' }
});

export const FacturaPDF = ({
    invoice,
    primaryColor,
    textColor,
    logoDataUrl,
}: {
    invoice: any,
    primaryColor: string;
    textColor: string;
    logoDataUrl?: string | null;
}) => {
    const {
        company,
        createdAt,
        client,
        items = [], // 🔥 AHORA USAMOS ITEMS
        totalAmount, // 🔥 AHORA USAMOS TOTAL AMOUNT
    } = invoice;

    const AGENCY_TIME_ZONE = 'America/Havana';

    const bgLight = '#f8fafc';
    const borderColor = '#e2e8f0';
    const textMuted = '#64748b';
    const statusColor = invoice.status === 'PAID' ? '#16a34a' : invoice.status === 'CANCELLED' ? '#fa5252' : '#f59e0b';

    const displayLogo = logoDataUrl || company?.logoUrl;

    return (
        <Document>
            <Page size="LETTER" style={styles.page}>
                {/* ENCABEZADO */}
                <View style={styles.header}>
                    <View style={styles.companyInfo}>
                        {displayLogo && (
                            <Image src={displayLogo} style={{ width: 120, marginBottom: 10 }} />
                        )}
                        <Text style={styles.companyName}>{company?.commercialName || 'Mi Agencia de Viajes'}</Text>
                        <Text>{company?.address}</Text>
                        <Text>Tel: {company?.phone}</Text>
                        {company?.email && <Text>Email: {company.email}</Text>}
                    </View>

                    <View style={styles.titleSection}>
                        <Text style={[styles.title, { color: primaryColor }]}>FACTURA</Text>
                        <Text style={styles.invoiceNumber}>Nº: {invoice.invoiceNumber}</Text>
                        <Text style={styles.date}>Fecha: {format(new Date(invoice.createdAt), 'dd/MM/yyyy')}</Text>
                        <Text style={styles.date}>Estado:
                            <Text style={[styles.date, { color: statusColor, fontWeight: 700 }]}>
                                {invoice.status === 'PAID' ? ' PAGADA' : invoice.status === 'CANCELLED' ? ' CANCELADA' : ' PENDIENTE'}
                            </Text>
                        </Text>
                    </View>
                </View>

                {/* DATOS DEL CLIENTE */}
                <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.sectionTitle}>Facturar a:</Text>
                        {client ? (
                            <>
                                <Text style={{ fontWeight: 600 }}>{client.fullName}</Text>
                                <Text>Pasaporte: {client.passportNumber}</Text>
                                <Text>Tel: {client.phone}</Text>
                                {client.email && <Text>Email: {client.email}</Text>}
                            </>
                        ) : (
                            <Text>Cliente General (Sin registro)</Text>
                        )}
                    </View>
                </View>

                {/* TABLA DE CONCEPTOS */}
                <View style={styles.table}>
                    <View style={[styles.tableHeader, { backgroundColor: `${primaryColor}15` }]}>
                        <Text style={[styles.tableHeaderText, styles.colDescription]}>Descripción del Servicio</Text>
                        <Text style={[styles.tableHeaderText, styles.colQty]}>Cant.</Text>
                        <Text style={[styles.tableHeaderText, styles.colAmount]}>Precio</Text>
                        <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
                    </View>

                    {/* 🔥 ITERAMOS SOBRE LOS ITEMS */}
                    {items.map((item: any, index: number) => (
                        <View key={index} style={styles.tableRow}>
                            <View style={styles.colDescription}>
                                <Text>{item.description}</Text>
                                {item.reservation && (
                                    <Text style={{ fontSize: 8, color: '#666', marginTop: 2 }}>
                                        Ref Reserva: {item.reservation.reservationCode}
                                    </Text>
                                )}
                            </View>
                            <Text style={styles.colQty}>{item.quantity}</Text>
                            <Text style={styles.colAmount}>{(Number(item.amount) || 0).toFixed(2)}</Text>
                            <Text style={styles.colTotal}>
                                {((Number(item.amount) || 0) * (item.quantity || 1)).toFixed(2)}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* TOTALES */}
                <View style={styles.totalsSection}>
                    <View style={[styles.totalRow, { marginTop: 8, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8 }]}>
                        <Text style={[styles.totalLabel, { fontSize: 12 }]}>TOTAL:</Text>
                        <Text style={[styles.totalValue, { fontSize: 12, color: primaryColor }]}>
                            {/* 🔥 Usamos totalAmount */}
                            {(Number(totalAmount) || 0).toFixed(2)} {invoice.currency}
                        </Text>
                    </View>
                </View>

                {/* PIE DE PÁGINA */}
                <View style={{ position: 'absolute', bottom: 35, left: 35, right: 35, borderTop: `1px solid ${borderColor}`, paddingTop: 15 }}>
                    <StackPDF align="center" gap={3}>
                        {displayLogo && (
                            <Image style={{ width: '80px', maxHeight: 40, objectFit: 'contain', marginBottom: 2 }} src={displayLogo} />
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