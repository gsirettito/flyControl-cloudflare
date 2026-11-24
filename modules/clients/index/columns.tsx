import { createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ActionIcon, Badge, Box, Checkbox, Menu, Stack, Text } from '@mantine/core';
import { ClientType } from '@/types/ModelsType';
import { FiMoreVertical, FiEdit, FiTrash2, FiEye } from 'react-icons/fi';
import dayjs from 'dayjs';

const columnHelper = createColumnHelper<ClientType>();

export const getColumns = (
    onViewDetails: (client: ClientType) => void,
    onEdit: (client: ClientType) => void,
    onDelete: (client: ClientType) => void
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
        columnHelper.accessor('type', {
            id: 'type',
            header: 'Tipo de pasajero',
            cell: (info) => info.getValue() ?? '—',
            enableSorting: true,
            meta: { sticky: 'left', stickyOffset: 34 },
        }),
        columnHelper.accessor('fullName', {
            id: 'fullName',
            header: 'Nombre',
            cell: (info) => (
                <Box w={'150px'}>
                    <Text
                        style={{
                            cursor: 'pointer', textDecoration: 'none', color: 'var(--mantine-color-dark-9)',
                            transition: 'color 0.2s'
                        }}
                        onClick={() => onViewDetails(info.row.original)}
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
            cell: (info) => <Box >{info.getValue() ?? '—'}</Box>,
            enableSorting: true,
        }),
        columnHelper.accessor('phone', {
            id: 'phone',
            header: 'Telefono',
            cell: (info) => <Box w={'150px'}>{info.getValue() ?? '—'}</Box>,
            enableSorting: true,
        }),
        columnHelper.accessor('nationality', {
            id: 'nationality',
            header: 'Nacionalidad',
            cell: (info) => info.getValue(),
            enableSorting: true,
        }),
        columnHelper.accessor('passportIssueDate', {
            id: 'passportIssueDate',
            header: 'Emisión del pasaporte',
            cell: (info) => dayjs(info.getValue()).toDate().toLocaleDateString(),
            enableSorting: true,
        }),
        columnHelper.accessor('passportExpiryDate', {
            id: 'passportExpiryDate',
            header: 'Vencimiento del pasaporte',
            cell: (info) => dayjs(info.getValue()).toDate().toLocaleDateString(),
            enableSorting: true,
        }),
        columnHelper.accessor('birthDate', {
            id: 'birthDate',
            header: 'Fecha de nacimiento',
            cell: (info) => dayjs(info.getValue()).toDate().toLocaleDateString(),
            enableSorting: true,
        }),

        columnHelper.display({
            id: 'actions',
            header: '',
            cell: ({ row }) => {
                const user = row.original;
                return (
                    <Menu position="bottom-end" withArrow>
                        <Menu.Target>
                            <ActionIcon variant="subtle" color="gray">
                                <FiMoreVertical size={16} />
                            </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                            <Menu.Item leftSection={<FiEye size={14} />} onClick={() => onViewDetails(user)}>
                                Ver detalles
                            </Menu.Item>
                            <Menu.Item leftSection={<FiEdit size={14} />} onClick={() => onEdit(user)}>
                                Editar
                            </Menu.Item>
                            <Menu.Item leftSection={<FiTrash2 size={14} />} color="red" onClick={() => onDelete(user)}>
                                Eliminar
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                );
            },
            enableSorting: false,
            meta: { sticky: 'right' },
        }),
    ];