import { createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { ActionIcon, Checkbox, Menu, Stack, Image, Flex, Switch, Progress, Box, Text } from '@mantine/core';
import { ClientType, FlightType } from '@/types/ModelsType';
import { FiMoreVertical, FiEdit, FiTrash2, FiUsers, FiActivity } from 'react-icons/fi';
import dayjs from 'dayjs';

const columnHelper = createColumnHelper<FlightType>();
const columnHelperPassenger = createColumnHelper<ClientType>();

export const getColumns = (
    isAdmin: boolean, // 🔒 FIX: Recibimos el rol del usuario
    onEdit: (airline: FlightType) => void,
    onDelete: (airline: FlightType) => void,
    onShowPassenger: (airline: FlightType) => void,
    onViewDetails: (airline: FlightType) => void,
) => [
        // ... (las columnas de selección, fechas, número de vuelo, etc. se mantienen exactamente igual)
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
        columnHelper.accessor('departureTime', {
            id: 'departureTime',
            header: 'Fecha de Salida',
            cell: (info) => {
                const dateStr = info.getValue();
                if (!dateStr) return <Stack w={'150px'}>-</Stack>;
                const tz = info.row.original.originTimezone || 'UTC';
                return <Stack w={'150px'}>{formatInTimeZone(new Date(dateStr), tz, 'd MMM yyyy, HH:mm', { locale: es })}</Stack>;
            },
            enableSorting: true,
        }),
        columnHelper.accessor('arrivalTime', {
            id: 'arrivalTime',
            header: 'Fecha de Llegada',
            cell: (info) => {
                const dateStr = info.getValue();
                if (!dateStr) return <Stack w={'150px'}>-</Stack>;
                const tz = info.row.original.destinationTimezone || 'UTC';
                return <Stack w={'150px'}>{formatInTimeZone(new Date(dateStr), tz, 'd MMM yyyy, HH:mm', { locale: es })}</Stack>;
            },
            enableSorting: true,
        }),
        columnHelper.accessor('flightNumber', {
            id: 'flightNumber',
            header: 'Número de Vuelo',
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
            enableSorting: false,
            meta: { sticky: 'left', stickyOffset: 34 },
        }),
        columnHelper.accessor('airline.displayName', {
            id: 'airline',
            header: 'Aerolínea',
            cell: (info) => info.getValue() ?? '—',
            enableSorting: true,
        }),
        columnHelper.accessor('origin', {
            id: 'origin',
            header: 'Origen',
            cell: (info) => {
                const origin = info.getValue() ?? '—'
                const originName = info.row.original.originName
                return <Box w={'150px'}>{`${originName} (${origin})`}</Box>
            },
            enableSorting: false,
        }),
        columnHelper.accessor('destination', {
            id: 'destination',
            header: 'Destino',
            cell: (info) => {
                const destination = info.getValue() ?? '—'
                const destinationName = info.row.original.destinationName
                return <Box w={'150px'}>{`${destinationName} (${destination})`}</Box>
            },
            enableSorting: false,
        }),
        columnHelper.accessor('class', {
            id: 'class',
            header: 'Clase',
            cell: (info) => {
                const fly_class = info.getValue() ?? '—'
                switch (fly_class) {
                    case "ECONOMY": return <>ECONOMICA</>
                    case "FIRST": return <>PRIMERA CLASE</>
                    case "BUSINESS": return <>BUSINESS</>
                }
            },
            enableSorting: true,
        }),
        columnHelper.accessor('availableSeats', {
            id: 'availableSeats',
            header: 'Asientos',
            cell: (info) => {
                const count = info.getValue()
                let reserved = (info.row.original as any).reservedSeats
                return (
                    <Flex align={'center'} gap={12}>
                        <Progress w={'50px'} value={(reserved * 100) / count} />
                        <Flex w={'50px'}>
                            {reserved} / {count}
                        </Flex>
                    </Flex>
                )
            },
            enableSorting: true,
        }),
        columnHelper.display({
            id: 'actions',
            header: '',
            cell: ({ row }) => {
                const target = row.original;
                return (
                    <Menu position="bottom-end" withArrow>
                        <Menu.Target>
                            <ActionIcon variant="subtle" color="gray">
                                <FiMoreVertical size={16} />
                            </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                            <Menu.Item leftSection={<FiUsers size={14} />} onClick={() => onShowPassenger(target)}>
                                Pasajeros
                            </Menu.Item>
                            <Menu.Item leftSection={<FiActivity size={14} />} onClick={() => onViewDetails(target)}>
                                Detalles
                            </Menu.Item>

                            {/* 🔒 FIX: Solo mostramos Editar y Eliminar si el usuario es Administrador */}
                            {isAdmin && (
                                <>
                                    <Menu.Item leftSection={<FiEdit size={14} />} onClick={() => onEdit(target)}>
                                        Editar
                                    </Menu.Item>
                                    <Menu.Item leftSection={<FiTrash2 size={14} />} color="red" onClick={() => onDelete(target)}>
                                        Eliminar
                                    </Menu.Item>
                                </>
                            )}
                        </Menu.Dropdown>
                    </Menu>
                );
            },
            enableSorting: false,
            meta: { sticky: 'right' },
        }),
    ];

export const getColumnsPassenger = () => [
    // ... (esta función se mantiene exactamente igual)
    columnHelperPassenger.display({
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
    columnHelperPassenger.accessor('createdAt', {
        id: 'createdAt',
        header: 'Fecha de creación',
        cell: (info) => <Stack w={'150px'}>{format(new Date(info.getValue()), 'd MMM yyyy, HH:mm', { locale: es })}</Stack>,
        enableSorting: true,
    }),
    columnHelperPassenger.accessor('type', {
        id: 'type',
        header: 'Tipo de pasajero',
        cell: (info) => info.getValue() ?? '—',
        enableSorting: true,
        meta: { sticky: 'left', stickyOffset: 34 },
    }),
    columnHelperPassenger.accessor('fullName', {
        id: 'fullName',
        header: 'Nombre',
        cell: (info) => <Box w={'150px'}>{info.getValue() ?? '—'}</Box>,
        enableSorting: true,
        meta: { sticky: 'left', stickyOffset: 34 },
    }),
    columnHelperPassenger.accessor('email', {
        id: 'email',
        header: 'Correo',
        cell: (info) => <Box >{info.getValue() ?? '—'}</Box>,
        enableSorting: true,
    }),
    columnHelperPassenger.accessor('phone', {
        id: 'phone',
        header: 'Telefono',
        cell: (info) => <Box w={'150px'}>{info.getValue() ?? '—'}</Box>,
        enableSorting: true,
    }),
    columnHelperPassenger.accessor('nationality', {
        id: 'nationality',
        header: 'Nacionalidad',
        cell: (info) => info.getValue(),
        enableSorting: true,
    }),
    columnHelperPassenger.accessor('passportIssueDate', {
        id: 'passportIssueDate',
        header: 'Emisión del pasaporte',
        cell: (info) => dayjs(info.getValue()).toDate().toLocaleDateString(),
        enableSorting: true,
    }),
    columnHelperPassenger.accessor('passportExpiryDate', {
        id: 'passportExpiryDate',
        header: 'Vencimiento del pasaporte',
        cell: (info) => dayjs(info.getValue()).toDate().toLocaleDateString(),
        enableSorting: true,
    }),
    columnHelperPassenger.accessor('birthDate', {
        id: 'birthDate',
        header: 'Fecha de nacimiento',
        cell: (info) => dayjs(info.getValue()).toDate().toLocaleDateString(),
        enableSorting: true,
    })
];