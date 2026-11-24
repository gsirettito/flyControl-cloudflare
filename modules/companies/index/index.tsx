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
import { FormCompany } from './form';
import { CompanyType } from '@/types/ModelsType';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useSession } from 'next-auth/react'; // 🔒 FIX: Importamos useSession

dayjs.extend(utc);

export const CompaniesIndex = () => {
    const buttonAddRef = useRef<ButtonAddRef>(null);
    const tableRef = useRef<DataTableRef>(null);

    // 🔒 FIX: Obtenemos la sesión
    const { data: session } = useSession();
    const isSuperAdmin = session?.user?.isSuperAdmin || false;

    const handleEdit = (company: CompanyType) => {
        const {
            id, commercialName, primaryColor, secondaryColor, textColor, phone, address, ticketPrefix, preReservationExpiryHours
        } = company
        buttonAddRef.current?.showEdit({
            id, commercialName, primaryColor, secondaryColor, textColor, phone, address, ticketPrefix, preReservationExpiryHours
        })
        setEdit(true)
    }

    const handleDelete = (company: CompanyType) => {
        modals.openConfirmModal({
            title: 'Confirmar eliminación',
            children: (
                <Text size="sm">
                    ¿Estás seguro de que deseas eliminar la empresa: <strong>{company.commercialName}</strong>?
                    Esta acción no se puede deshacer.
                </Text>
            ),
            labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
            confirmProps: { color: 'red' },
            centered: true,
            onConfirm: async () => {
                try {
                    const url = new URL(`/api/system/companies`, window.location.origin);
                    const res = await fetch(url.toString(), {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: company.id }),
                    });
                    const result = await res.json();
                    if (!res.ok) throw new Error(result.error || result.message || 'Error al eliminar');
                    notifications.show({
                        title: 'Éxito',
                        message: 'Empresa eliminada correctamente',
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

    // 🔒 FIX: Pasamos isSuperAdmin
    const columns = getColumns(isSuperAdmin, handleEdit, handleDelete);

    const [isEdit, setEdit] = useState(false)

    return (
        <Stack>
            <Flex>
                <Title flex={1} order={1}>Listado de empresas</Title>
                {/* 🔒 FIX: Ocultar botón de crear para Admins normales */}
                {isSuperAdmin && (
                    <ButtonAdd
                        ref={buttonAddRef}
                        apiUrl="/api/system/companies"
                        label={isEdit ? 'Editar Empresa' : 'Crear Nueva Empresa'}
                        buttonLabel={'Crear Nueva Empresa'}
                        form={FormCompany}
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
                apiUrl="/api/system/companies"
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
                columnOrderStorageKey="column_companies"
            />
        </Stack>
    );
};