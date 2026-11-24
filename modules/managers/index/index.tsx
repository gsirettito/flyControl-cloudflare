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
import { FormManager } from './form';
import { CompanyType, UserType } from '@/types/ModelsType';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useSession } from 'next-auth/react';

dayjs.extend(utc);

export const ManagersIndex = () => {
    const buttonAddRef = useRef<ButtonAddRef>(null);
    const tableRef = useRef<DataTableRef>(null);

    const { data: session } = useSession(); // 🔒 FIX: Obtenemos la sesión
    const currentUserId = session?.user?.id; // 🔒 FIX: Extraemos el ID

    const handleEdit = (manage: UserType) => {
        // 🔒 FIX: Doble validación de seguridad
        if (manage.id === currentUserId) {
            notifications.show({
                title: 'Acción no permitida',
                message: 'No puedes editar tu propio perfil desde esta sección para evitar cambios accidentales en tus permisos.',
                color: 'red',
            });
            return;
        }

        const {
            id,
            email,
            name,
            isAdmin,
            isSuperAdmin,
            isManager
        } = manage
        buttonAddRef.current?.showEdit({
            id,
            email,
            name,
            isAdmin,
            isSuperAdmin,
            isManager
        })
        setEdit(true)
    }

    const handleDelete = (manage: UserType) => {
        // 🔒 FIX: Doble validación de seguridad
        if (manage.id === currentUserId) {
            notifications.show({
                title: 'Acción no permitida',
                message: 'No puedes eliminar tu propia cuenta.',
                color: 'red',
            });
            return;
        }

        modals.openConfirmModal({
            title: 'Confirmar eliminación',
            children: (
                <Text size="sm">
                    ¿Estás seguro de que deseas eliminar al gestor: <strong>{manage.name}</strong>?
                    Esta acción no se puede deshacer.
                </Text>
            ),
            labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
            confirmProps: { color: 'red' },
            centered: true,
            onConfirm: async () => {
                try {
                    const url = new URL(`/api/system/managers`, window.location.origin);
                    const res = await fetch(url.toString(), {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: manage.id }),
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

    // 🔒 FIX: Pasamos currentUserId a getColumns
    const columns = getColumns(currentUserId, handleEdit, handleDelete);

    const [isEdit, setEdit] = useState(false)

    return (
        <Stack>
            <Flex>
                <Title flex={1} order={1}>Listado de gestores</Title>
                <ButtonAdd
                    ref={buttonAddRef}
                    apiUrl="/api/system/managers"
                    label={isEdit ? 'Editar Gestor' : 'Crear Nuevo Gestor'}
                    buttonLabel={'Crear Nuevo Gestor'}
                    form={FormManager}
                    exclude={['id', 'userId']}
                    onSuccess={async () => {
                        await tableRef.current?.refresh() as any
                    }}
                    onClick={() => setEdit(false)}
                />
            </Flex>
            <DataTable
                ref={tableRef}
                apiUrl="/api/system/managers"
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
                columnOrderStorageKey="column_manager"
            />
        </Stack>
    );
};