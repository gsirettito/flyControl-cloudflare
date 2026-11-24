'use client';

import { useEffect, useState } from 'react';
import { Modal, Loader, Center, Button, Group, Box, Flex } from '@mantine/core';
import dynamic from 'next/dynamic';
import { InvoicePDF } from '../InvoicePDF';

const PDFViewer = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFViewer),
    { ssr: false }
);

interface PDFPreviewModalProps {
    opened: boolean;
    onClose: () => void;
    reservationId: string;
    onDownload: () => void;
}

export function PDFPreviewModal({ opened, onClose, reservationId, onDownload }: PDFPreviewModalProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (opened && reservationId) {
            setLoading(true);
            fetch(`/api/system/reservation/preview?id=${reservationId}`)
                .then(res => res.json())
                .then(resData => {
                    if (!resData.error) setData(resData);
                })
                .finally(() => setLoading(false));
        } else {
            setData(null);
        }
    }, [opened, reservationId]);

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Vista Previa del Boleto"
            fullScreen
            padding={0} // 🔥 Quitamos el padding del modal para que el PDF pegue a los bordes
            styles={{
                // 🔥 Hacemos que el cuerpo del modal ocupe el 100% de la altura de la pantalla
                body: { height: '100vh', display: 'flex', flexDirection: 'column' },
                header: { padding: '10px 20px', marginBottom: 0, borderBottom: '1px solid var(--mantine-color-gray-3)' }
            }}
        >
            <Flex direction="column" style={{ flex: 1, overflow: 'hidden' }}>
                {/* Contenedor del PDF (Ocupa todo el espacio sobrante) */}
                <Box style={{ flex: 1, backgroundColor: '#525659' }}>
                    {loading || !data ? (
                        <Center h="100%">
                            <Loader color="white" />
                        </Center>
                    ) : (
                        <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
                            <InvoicePDF
                                reservation={data.reservation}
                                primaryColor={data.reservation.company?.primaryColor || "#3a486b"}
                                secondaryColor={data.reservation.company?.secondaryColor || "#068ea1"}
                                textColor={data.reservation.company?.textColor || "#363636"}
                                qrDataUrl={data.qrDataUrl}
                                logoDataUrl={data.logoDataUrl}
                            />
                        </PDFViewer>
                    )}
                </Box>

                {/* Barra de acciones inferior (Fija) */}
                <Group
                    justify="flex-end"
                    p="md"
                    style={{
                        backgroundColor: 'var(--mantine-color-body)',
                        borderTop: '1px solid var(--mantine-color-gray-3)'
                    }}
                >
                    <Button variant="default" onClick={onClose}>Cerrar</Button>
                    <Button onClick={onDownload} disabled={!data}>
                        Generar y Descargar PDF Oficial
                    </Button>
                </Group>
            </Flex>
        </Modal>
    );
}