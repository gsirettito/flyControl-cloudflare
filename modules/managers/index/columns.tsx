import { createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ActionIcon, Badge, Checkbox, Menu, Stack, Box, Text } from '@mantine/core';
import { UserType } from '@/types/ModelsType';
import { FiMoreVertical, FiEdit, FiTrash2 } from 'react-icons/fi';

const columnHelper = createColumnHelper<UserType>();

export const getColumns = (
    currentUserId: string | undefined,
    onEdit: (company: UserType) => void,
    onDelete: (company: UserType) => void
) => [
        // Columna de selección (checkbox) – fijada a la izquierda
        columnHelper.display({
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllRowsSelected()}
                    indeterminate={table.getIsSomeRowsSelected()}
                    onChange={table.getToggleAllRowsSelectedHandler()}
                    size="xs"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onChange={row.getToggleSelectedHandler()}
                    size="xs"
                />
            ),
            enableSorting: false,
            meta: { sticky: 'left', stickyOffset: 0 },
        }),
        columnHelper.accessor('createdAt', {
            id: 'createdAt',
            header: 'Fecha de creación',
            cell: (info) => <Stack w={'150px'}>{format(new Date(info.getValue()), 'd MMM yyyy, HH:mm', { locale: es })}</Stack>,
            enableSorting: true,
        }),
        columnHelper.accessor('name', {
            id: 'name',
            header: 'Nombre',
            cell: (info) => (
                <Box w={'150px'}>
                    <Text
                        style={{
                            cursor: 'pointer', textDecoration: 'none', color: 'var(--mantine-color-dark-9)',
                            transition: 'color 0.2s'
                        }}
                        // onClick={() => onViewDetails(info.row.original)}
                        fw={500}
                    >
                        {info.getValue() ?? '—'}
                    </Text>
                </Box>
            ),
            enableSorting: true,
            meta: { sticky: 'left', stickyOffset: 34 },
        }),
        columnHelper.accessor('email', {
            id: 'email',
            header: 'Correo',
            cell: (info) => info.getValue(),
            enableSorting: true,
        }),
        // columnHelper.accessor('company.commercialName', {
        //     id: 'company',
        //     header: ()=>{
        //         return 'Nombre Empresa'
        //     },
        //     cell: (info) =>  info.getValue(),
        //     enableSorting: false,
        // }),
        columnHelper.accessor('isAdmin', {
            id: 'Rol',
            header: 'Rol',
            cell: (info) => {
                const isAdmin = info.getValue();
                const isSuperAdmin = info.row.original.isSuperAdmin;
                const isManager = info.row.original.isManager;
                const isSelf = info.row.original.id === currentUserId;

                if (isSuperAdmin) return <Badge color="orange" variant='light' w={'100px'}>Super Admin</Badge>;
                if (isAdmin) return <Badge color="blue" variant='light' w={'100px'}>Admin {isSelf && '(Tú)'}</Badge>;
                if (isManager) return <Badge color="green" variant='light' w={'100px'}>Gestor {isSelf && '(Tú)'}</Badge>;
                return <Badge color="gray" variant='light' w={'100px'}>Sin Definición</Badge>;
            },
            enableSorting: true,
        }),
        columnHelper.display({
            id: 'actions',
            header: '',
            cell: ({ row }) => {
                const user = row.original;
                const isSelf = user.id === currentUserId; // 🔒 FIX: Evaluamos si es el usuario logueado
                return (
                    <Menu position="bottom-end" withArrow>
                        <Menu.Target>
                            <ActionIcon variant="subtle" color="gray">
                                <FiMoreVertical size={16} />
                            </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                            {/* 🔒 FIX: Deshabilitamos la edición de su propio perfil desde aquí */}
                            <Menu.Item
                                leftSection={<FiEdit size={14} />}
                                onClick={() => onEdit(user)}
                                disabled={isSelf}
                            >
                                Editar
                            </Menu.Item>

                            {/* 🔒 FIX: Ocultamos la opción de eliminar si es él mismo */}
                            {!isSelf && (
                                <Menu.Item leftSection={<FiTrash2 size={14} />} color="red" onClick={() => onDelete(user)}>
                                    Eliminar
                                </Menu.Item>
                            )}
                        </Menu.Dropdown>
                    </Menu>
                );
            },
            enableSorting: false,
            meta: { sticky: 'right' },
        }),
    ];