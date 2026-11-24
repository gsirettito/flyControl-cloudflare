// modules/invoices/index.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Flex, Stack, Title, Button, Modal, Group, Loader, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { FiPlus } from 'react-icons/fi';
import { useForm, FormProvider } from 'react-hook-form';
import { DataTable, DataTableRef } from '@/components/DataTable';
import { getColumns } from './columns';
import { filterConfigs } from './filterConfigs';
import { BarFilter } from '@/components/DataTable/components/BarFilter';
import { modals } from '@mantine/modals';
import { FormInvoice, InvoiceFormValues } from './form';

export const InvoicesIndex = () => {
    const tableRef = useRef<DataTableRef>(null);
    const [opened, { open, close }] = useDisclosure(false);
    const [creating, setCreating] = useState(false);
    const [generatingPDF, setGeneratingPDF] = useState(false);

    const [clients, setClients] = useState<any[]>([]);
    const [reservations, setReservations] = useState<any[]>([]);

    const searchParams = useSearchParams();

    const methods = useForm<InvoiceFormValues>({
        defaultValues: {
            clientId: null,
            currency: 'USD',
            items: [{ description: '', quantity: 1, amount: 0, reservationId: null }]
        }
    });

    // 1. Cargar datos para los selectores
    useEffect(() => {
        const fetchDataForSelectors = async () => {
            try {
                const [cliRes, resRes] = await Promise.all([
                    fetch('/api/system/clients?limit=100'),
                    fetch('/api/system/reservation?limit=100')
                ]);
                const cliData = await cliRes.json();
                const resData = await resRes.json();

                if (cliData.data) setClients(cliData.data.map((c: any) => ({ value: c.id, label: `${c.fullName} (${c.passportNumber})` })));
                if (resData.data) setReservations(resData.data.map((r: any) => ({ value: r.id, label: `${r.reservationCode} - ${r.passenger?.fullName}` })));
            } catch (error) {
                console.error("Error cargando datos", error);
            }
        };
        fetchDataForSelectors();
    }, []);

    // 2. Pre-llenar formulario si viene desde la reserva
    useEffect(() => {
        if (searchParams.get('create') === 'true') {
            const clientId = searchParams.get('clientId');
            const reservationId = searchParams.get('reservationId');
            const description = searchParams.get('description');
            const amount = searchParams.get('amount');

            methods.reset({
                clientId: clientId || null,
                currency: 'USD',
                items: [{
                    description: description || '',
                    amount: Number(amount) || 0,
                    quantity: 1,
                    reservationId: reservationId || null
                }]
            });
            open();
            // Limpiamos la URL
            window.history.replaceState(null, '', '/invoices');
        }
    }, [searchParams, open, methods]);

    const onSubmit = async (data: InvoiceFormValues) => {
        setCreating(true);
        try {
            const res = await fetch('/api/system/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const resData = await res.json();
            if (!res.ok) throw new Error(resData.error || 'Error al crear factura');

            notifications.show({ title: 'Éxito', message: 'Factura creada correctamente', color: 'green' });
            close();
            methods.reset({ clientId: null, currency: 'USD', items: [{ description: '', quantity: 1, amount: 0, reservationId: null }] });
            await tableRef.current?.refresh();
        } catch (error: any) {
            notifications.show({ title: 'Error', message: error.message, color: 'red' });
        } finally {
            setCreating(false);
        }
    };

    const handleMarkAsPaid = async (invoice: any) => {
        try {
            const res = await fetch('/api/system/invoices', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: invoice.id, status: 'PAID' })
            });
            if (!res.ok) throw new Error('Error al actualizar');
            notifications.show({ title: 'Éxito', message: 'Factura marcada como pagada', color: 'green' });
            await tableRef.current?.refresh();
        } catch (error: any) {
            notifications.show({ title: 'Error', message: error.message, color: 'red' });
        }
    };

    const handleCancel = (invoice: any) => {
        modals.openConfirmModal({
            title: 'Cancelar Factura',
            children: (
                <Text size="sm">
                    ¿Estás seguro de que deseas cancelar la factura <strong>{invoice.invoiceNumber}</strong>?
                </Text>
            ),
            labels: { confirm: 'Sí, cancelar', cancel: 'Volver' },
            confirmProps: { color: 'red' },
            centered: true,
            onConfirm: async () => {
                try {
                    const res = await fetch('/api/system/invoices', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: invoice.id })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Error al cancelar');

                    notifications.show({ title: 'Éxito', message: 'Factura cancelada', color: 'green' });
                    await tableRef.current?.refresh();
                } catch (error: any) {
                    notifications.show({ title: 'Error', message: error.message, color: 'red' });
                }
            },
        });
    };

    const handleDownloadPDF = async (invoice: any) => {
        setGeneratingPDF(true);
        try {
            const res = await fetch('/api/system/invoices/refresh-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invoiceId: invoice.id })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al generar PDF');

            window.open(data.pdfURL, '_blank');
            await tableRef.current?.refresh();
        } catch (error: any) {
            notifications.show({ title: 'Error', message: error.message, color: 'red' });
        } finally {
            setGeneratingPDF(false);
        }
    };

    const columns = getColumns(handleMarkAsPaid, handleCancel, handleDownloadPDF);

    return (
        <Stack>
            <Flex>
                <Title flex={1} order={1}>Facturación</Title>
                <Button leftSection={<FiPlus size={16} />} onClick={open}>
                    Nueva Factura
                </Button>
            </Flex>

            <DataTable
                ref={tableRef}
                apiUrl="/api/system/invoices"
                columns={columns}
                initialParams={{ limit: 10, sortBy: 'createdAt', sortOrder: 'desc' }}
                enableGlobalFilter={false}
                renderFilters={(filters, setColumnFilter) => BarFilter({ filterConfigs, filters, setColumnFilter })}
                enableColumnOrdering={true}
                excludeFromColumnOrdering={['select', 'actions']}
                columnOrderStorageKey="column_invoices_v2"
            />

            <Modal opened={opened} onClose={close} title="Crear Nueva Factura" centered size="lg">
                <FormProvider {...methods}>
                    <form onSubmit={methods.handleSubmit(onSubmit)}>
                        {/* 👇 Simplificamos las props, solo pasamos las opciones */}
                        <FormInvoice
                            clients={clients}
                            reservations={reservations}
                        />
                        <Group justify="flex-end" mt="xl">
                            <Button variant="default" onClick={close}>Cancelar</Button>
                            <Button type="submit" loading={creating}>Crear Factura</Button>
                        </Group>
                    </form>
                </FormProvider>
            </Modal>

            <Modal opened={generatingPDF} onClose={() => { }} title="Generando Documento" centered withCloseButton={false} closeOnClickOutside={false} closeOnEscape={false}>
                <Flex justify="center" align="center" gap="md" p="lg">
                    <Loader size="md" />
                    <Text>Generando el PDF más reciente, por favor espere...</Text>
                </Flex>
            </Modal>
        </Stack>
    );
};