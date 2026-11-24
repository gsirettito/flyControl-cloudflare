'use client';

import { DataTable, DataTableRef } from '@/components/DataTable';
import { Flex, Stack, Title, Text } from '@mantine/core';
import { getColumns } from './columns';
import { useRef, useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { filterConfigs } from './filterConfigs';
import { BarFilter } from '@/components/DataTable/components/BarFilter';
import { ButtonAddRef, ButtonAdd } from '@/components/ButtonAdd';
import { FormClient } from './form';
import { ClientType } from '@/types/ModelsType';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { ClientDetailsDrawer } from './components/ClientDetailsDrawer';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

dayjs.extend(utc);

export const ClientsIndex = () => {
    const buttonAddRef = useRef<ButtonAddRef>(null);
    const tableRef = useRef<DataTableRef>(null);
    const searchParams = useSearchParams();

    // Estados para el Drawer de detalles
    const [drawerOpened, setDrawerOpened] = useState(false);
    const [selectedClient, setSelectedClient] = useState<ClientType | null>(null);

    // 👇 Efecto para abrir el modal
    useEffect(() => {
        if (searchParams.get('action') === 'create') {
            buttonAddRef.current?.showCreate(); // Llama a la nueva función
            window.history.replaceState(null, '', '/clients'); // Limpia la URL
            setEdit(false); // Asegura que el texto del botón diga "Crear"
        }
    }, [searchParams]);

    const handleViewDetails = (client: ClientType) => {
        setSelectedClient(client);
        setDrawerOpened(true);
    };

    const handleEdit = (client: ClientType) => {
        const {
            id,
            email,
            phone,
            birthDate,
            fullName,
            nationality,
            passportExpiryDate,
            passportNumber,
            passportIssueDate,
            type
        } = client
        buttonAddRef.current?.showEdit({
            id,
            email,
            phone,
            birthDate,
            fullName,
            nationality,
            passportExpiryDate,
            passportNumber,
            passportIssueDate,
            type
        })
        setEdit(true)
    }

    const handleDelete = (client: ClientType) => {
        modals.openConfirmModal({
            title: 'Confirmar eliminación',
            children: (
                <Text size="sm">
                    ¿Estás seguro de que deseas eliminar al cliente: <strong>{client.fullName}</strong>?
                    Esta acción no se puede deshacer.
                </Text>
            ),
            labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
            confirmProps: { color: 'red' },
            centered: true,
            onConfirm: async () => {
                try {
                    const url = new URL(`/api/system/clients`, window.location.origin);
                    const res = await fetch(url.toString(), {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: client.id }),
                    });
                    const result = await res.json();
                    if (!res.ok) throw new Error(result.message || 'Error al eliminar');
                    notifications.show({
                        title: 'Éxito',
                        message: 'Gestor eliminado correctamente',
                        color: 'green',
                    });
                    // Refrescar la tabla
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

    const columns = getColumns(handleViewDetails, handleEdit, handleDelete);

    const [isEdit, setEdit] = useState(false)

    return (
        <Stack>
            <Flex>
                <Title flex={1} order={1}>Listado de clientes</Title>
                <ButtonAdd
                    ref={buttonAddRef}
                    apiUrl="/api/system/clients"
                    label={isEdit ? 'Editar Cliente' : 'Crear Nuevo Cliente'}
                    buttonLabel={'Crear Nuevo Cliente'}
                    form={FormClient}
                    exclude={['id', 'userId']}
                    onSuccess={async () => {
                        await tableRef.current?.refresh() as any
                    }}
                    onClick={() => setEdit(false)}
                />
            </Flex>
            <DataTable
                ref={tableRef}
                apiUrl="/api/system/clients"
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
                columnOrderStorageKey="column_clients"
            />

            {/* Renderizamos el Drawer */}
            <ClientDetailsDrawer
                opened={drawerOpened}
                onClose={() => setDrawerOpened(false)}
                client={selectedClient}
            />
        </Stack>
    );
};