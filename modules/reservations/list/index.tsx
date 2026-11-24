'use client';

import { DataTable, DataTableRef } from '@/components/DataTable';
import { Flex, Textarea, Group, Stack, Title, Text, Button, Modal, Loader } from '@mantine/core';
import { getColumns } from './columns';
import { useRef, useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { filterConfigs } from './filterConfigs';
import { BarFilter } from '@/components/DataTable/components/BarFilter';
import { ReservationType, FlightType, ClientType } from '@/types/ModelsType';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import Link from 'next/link';
import { useDisclosure } from '@mantine/hooks';
import { ModalConfirm } from './ModalConfirm';
import { ReservationDetailsDrawer } from './components/ReservationDetailsDrawer';
import { FlightDetailsDrawer } from '@/modules/flights/index/components/FlightDetailsDrawer';
import { ClientDetailsDrawer } from '@/modules/clients/index/components/ClientDetailsDrawer';
import { FiUploadCloud, FiEye } from 'react-icons/fi';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { PDFPreviewModal } from '@/components/PDFPreviewModal';
import { useSession } from 'next-auth/react'; // 🔒 FIX: Importamos useSession

dayjs.extend(utc);

export const ReservationListIndex = ({ expiryHours }: { expiryHours: number }) => {
    const tableRef = useRef<DataTableRef>(null);
    const { data: session } = useSession(); // 🔒 FIX: Obtenemos sesión
    const isAdmin = session?.user?.isAdmin || false; // 🔒 FIX: Verificamos rol

    const [opened, { open, close }] = useDisclosure(false);
    const [select, setSelect] = useState(undefined as undefined | ReservationType)

    const [bulkOpened, { open: openBulk, close: closeBulk }] = useDisclosure(false);
    const [bulkText, setBulkText] = useState('');
    const [loadingBulk, setLoadingBulk] = useState(false);

    const [refreshingPDF, setRefreshingPDF] = useState(false);

    const [selectedReservation, setSelectedReservation] = useState<ReservationType | null>(null);
    const [reservationDrawerOpened, setReservationDrawerOpened] = useState(false);

    const [previewReservation, setPreviewReservation] = useState<ReservationType | null>(null);

    const handlePreview = (reservation: ReservationType) => {
        setPreviewReservation(reservation);
    };

    const [selectedFlight, setSelectedFlight] = useState<FlightType | null>(null);
    const [flightDrawerOpened, setFlightDrawerOpened] = useState(false);

    const [selectedClient, setSelectedClient] = useState<ClientType | null>(null);
    const [clientDrawerOpened, setClientDrawerOpened] = useState(false);

    const searchParams = useSearchParams();
    useEffect(() => {
        if (searchParams.get('action') === 'import') {
            openBulk();
            window.history.replaceState(null, '', '/reservations/list');
        }
    }, [searchParams, openBulk]);

    const handleViewClientFromTable = (client: ClientType) => {
        setSelectedClient(client);
        setClientDrawerOpened(true);
    };

    const handleViewDetails = (reservation: ReservationType) => {
        setSelectedReservation(reservation);
        setReservationDrawerOpened(true);
    };

    const handleDelete = (reservation: ReservationType) => {
        // 🔒 FIX: Doble validación de seguridad
        if (!isAdmin) return;

        modals.openConfirmModal({
            title: 'Confirmar eliminación',
            children: (
                <Text size="sm">
                    ¿Estás seguro de que deseas cancelar la reservación: <strong>{reservation.reservationCode}</strong>?
                    Esta acción no se puede deshacer.
                </Text>
            ),
            labels: { confirm: 'Cancelar', cancel: 'Cancelar' },
            confirmProps: { color: 'red' },
            centered: true,
            onConfirm: async () => {
                try {
                    const url = new URL(`/api/system/reservation`, window.location.origin);
                    const res = await fetch(url.toString(), {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: reservation.id }),
                    });
                    const result = await res.json();
                    if (!res.ok) throw new Error(result.error || result.message || 'Error al eliminar');
                    notifications.show({
                        title: 'Éxito',
                        message: 'Reserva cancelada correctamente',
                        color: 'green',
                    });
                    await tableRef.current?.refresh() as any
                } catch (error: any) {
                    notifications.show({
                        title: 'Error',
                        message: error.message || 'Ocurrió un error inesperado',
                        color: 'red',
                    });
                }
            },
        });
    }

    const handleConfirm = (reservation: ReservationType) => {
        // 🔒 FIX: Doble validación de seguridad
        if (!isAdmin) return;

        setSelect(reservation)
        open()
    }

    const handleDownloadPDF = async (reservation: ReservationType) => {
        setRefreshingPDF(true);
        try {
            const res = await fetch('/api/system/reservation/refresh-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reservationId: reservation.id })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al generar el PDF');

            const baseUrl = data.pdfURL;
            if (!baseUrl) throw new Error('El servidor no devolvió la URL del PDF');

            const cacheBuster = Date.now();
            const separator = baseUrl.includes('?') ? '&' : '?';
            const urlWithCacheBuster = `${baseUrl}${separator}v=${cacheBuster}`;

            window.open(urlWithCacheBuster, '_blank');

            notifications.show({
                title: 'PDF Generado',
                message: 'El documento se ha actualizado y descargado correctamente.',
                color: 'green',
            });

            await tableRef.current?.refresh();
        } catch (error: any) {
            notifications.show({
                title: 'Error',
                message: error.message || 'No se pudo generar el PDF',
                color: 'red',
            });
        } finally {
            setRefreshingPDF(false);
        }
    };

    // 🔒 FIX: Pasamos isAdmin a getColumns
    const columns = getColumns(
        isAdmin,
        handleConfirm,
        handleDelete,
        handleDownloadPDF,
        handleViewDetails,
        handleViewClientFromTable,
        handlePreview,
        expiryHours
    );

    const handleBulkImport = async () => {
        setLoadingBulk(true);
        try {
            const res = await fetch('/api/system/reservation/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: bulkText })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            notifications.show({ title: 'Éxito', message: `Se importaron ${data.count} reservas correctamente.`, color: 'green' });
            setBulkText('');
            closeBulk();
            await tableRef.current?.refresh();
        } catch (error: any) {
            notifications.show({ title: 'Error de Importación', message: error.message, color: 'red', autoClose: 8000 });
        } finally {
            setLoadingBulk(false);
        }
    };

    return (
        <Stack>
            <Flex>
                <Title flex={1} order={1}>Listado de reservas</Title>

                <Button variant="outline" leftSection={<FiUploadCloud />} onClick={openBulk}>
                    Importar desde Texto
                </Button>

                <Link href={'/reservations'}>
                    <Button>
                        Crear Nueva Reservas
                    </Button>
                </Link>
            </Flex>
            <DataTable
                ref={tableRef}
                apiUrl="/api/system/reservation"
                columns={columns}
                initialParams={{
                    limit: 10,
                    sortBy: 'createdAt',
                    sortOrder: 'desc'
                }}
                enableGlobalFilter={false}
                renderFilters={(filters, setColumnFilter) => BarFilter({ filterConfigs, filters, setColumnFilter })}
                enableColumnOrdering={true}
                excludeFromColumnOrdering={['select', 'actions']}
                columnOrderStorageKey="column_reservation"
            />

            {opened && <ModalConfirm
                reservation={select as ReservationType}
                opened={opened}
                close={async () => { close(); await tableRef.current?.refresh() as any }}
            />}

            <ReservationDetailsDrawer
                opened={reservationDrawerOpened}
                onClose={() => setReservationDrawerOpened(false)}
                reservation={selectedReservation}
                onViewFlight={(flight) => {
                    setSelectedFlight(flight);
                    setFlightDrawerOpened(true);
                }}
                onViewClient={(client) => {
                    setSelectedClient(client);
                    setClientDrawerOpened(true);
                }}
            />

            {selectedFlight && (
                <FlightDetailsDrawer
                    opened={flightDrawerOpened}
                    onClose={() => setFlightDrawerOpened(false)}
                    flight={selectedFlight}
                />
            )}

            {selectedClient && (
                <ClientDetailsDrawer
                    opened={clientDrawerOpened}
                    onClose={() => setClientDrawerOpened(false)}
                    client={selectedClient}
                />
            )}

            <Modal
                opened={refreshingPDF}
                onClose={() => { }}
                title="Actualizando documento"
                centered
                withCloseButton={false}
                closeOnClickOutside={false}
                closeOnEscape={false}
            >
                <Flex justify="center" align="center" gap="md" p="lg">
                    <Loader />
                    <Text>Generando y subiendo el nuevo PDF, por favor espere...</Text>
                </Flex>
            </Modal>

            <Modal opened={bulkOpened} onClose={closeBulk} title="Importación Masiva de Reservas" size="xl">
                <Textarea
                    placeholder="Pega aquí el texto..."
                    minRows={20}
                    maxRows={30}
                    autosize
                    value={bulkText}
                    onChange={(e) => setBulkText(e.currentTarget.value)}
                    mb="md"
                    styles={{ input: { fontFamily: 'monospace', fontSize: '13px' } }}
                />
                <Group justify="flex-end">
                    <Button variant="default" onClick={closeBulk}>Cancelar</Button>
                    <Button onClick={handleBulkImport} loading={loadingBulk}>Procesar e Importar</Button>
                </Group>
            </Modal>

            <PDFPreviewModal
                opened={!!previewReservation}
                onClose={() => setPreviewReservation(null)}
                reservationId={previewReservation?.id as string}
                onDownload={() => {
                    if (previewReservation) {
                        handleDownloadPDF(previewReservation);
                    }
                    setPreviewReservation(null);
                }}
            />
        </Stack>
    );
};