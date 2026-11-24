'use client';

import { DataTable, DataTableRef } from '@/components/DataTable';
import { Flex, Stack, Title, Text } from '@mantine/core';
import { getColumns } from './columns';
import { useRef, useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { filterConfigs } from './filterConfigs';
import { BarFilter } from '@/components/DataTable/components/BarFilter';
import { ButtonAdd, ButtonAddRef } from '@/components/ButtonAdd';
import { FormAirline } from './form';
import { AirlineType } from '@/types/ModelsType';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useSession } from 'next-auth/react';

dayjs.extend(utc);

export const AirlinesIndex = () => {
    const buttonAddRef = useRef<ButtonAddRef>(null);
    const tableRef = useRef<DataTableRef>(null);
    const { data: session } = useSession();
    const isSuperAdmin = session?.user?.isSuperAdmin || false; // 🔒 Verificamos rol

    const handleEdit = (airline: AirlineType) => {
        const {
            id,
            iata,
            icao,
            officialName,
            displayName,
            logoUrl,
            active
        } = airline
        buttonAddRef.current?.showEdit({
            id,
            iata,
            icao,
            officialName,
            displayName,
            logoUrl,
            active
        })
        setEdit(true)
    }

    const handleDelete = (airline: AirlineType) => {
        modals.openConfirmModal({
            title: 'Confirmar eliminación',
            children: (
                <Text size="sm">
                    ¿Estás seguro de que deseas eliminar la empresa: <strong>{airline.displayName}</strong>?
                    Esta acción no se puede deshacer.
                </Text>
            ),
            labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
            confirmProps: { color: 'red' },
            centered: true,
            onConfirm: async () => {
                try {
                    const url = new URL(`/api/system/airlines`, window.location.origin);
                    const res = await fetch(url.toString(), {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: airline.id }),
                    });
                    const result = await res.json();
                    if (!res.ok) throw new Error(result.message || 'Error al eliminar');
                    notifications.show({
                        title: 'Éxito',
                        message: 'Aerolinea eliminada correctamente',
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

    const columns = getColumns(isSuperAdmin, handleEdit, handleDelete);

    const [isEdit, setEdit] = useState(false)

    return (
        <Stack>
            <Flex>
                <Title flex={1} order={1}>Listado de aerolineas</Title>
                {/* 🔒 FIX: Solo mostramos el botón de crear si es SuperAdmin */}
                {isSuperAdmin && (
                    <ButtonAdd
                        ref={buttonAddRef}
                        apiUrl="/api/system/airlines"
                        label={isEdit ? 'Editar Aerolinea' : 'Crear Nueva Aerolinea'}
                        buttonLabel={'Crear Nueva Aerolinea'}
                        form={FormAirline}
                        model="company"
                        exclude={['id', 'userId', 'apiKey']}
                        onSuccess={async () => {
                            await tableRef.current?.refresh() as any
                        }}
                        onClick={() => setEdit(false)}
                    />
                )}
            </Flex>
            <DataTable
                ref={tableRef}
                apiUrl="/api/system/airlines"
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
                columnOrderStorageKey="column_airline"
            />
        </Stack>
    );
};