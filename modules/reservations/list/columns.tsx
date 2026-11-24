import { createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { ActionIcon, Badge, Box, Checkbox, Flex, Menu, Stack, Text, Tooltip } from '@mantine/core';
import { ReservationType, ClientType } from '@/types/ModelsType';
import { FiMoreVertical, FiRefreshCw, FiX, FiEye } from 'react-icons/fi';
import { CountdownTimer } from '@/components/CountdownTimer';
import { IoAirplaneSharp } from 'react-icons/io5';
import { primary } from '@/components/ui/Theme/color';
import { BsCheck, BsFiletypePdf } from "react-icons/bs";

const columnHelper = createColumnHelper<ReservationType>();

export const getColumns = (
    isAdmin: boolean, // 🔒 FIX: Añadido para controlar permisos
    onConfirm: (client: ReservationType) => void,
    onDelete: (client: ReservationType) => void,
    onDownloadPDF: (client: ReservationType) => void,
    onViewDetails: (client: ReservationType) => void,
    onViewClient: (client: ClientType) => void,
    onPreview: (Client: ReservationType) => void,
    expiryHours: number
) => [
        // ... (columnas anteriores se mantienen igual)
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
        columnHelper.accessor('reservationCode', {
            id: 'reservationCode',
            header: 'Código',
            cell: (info) => (
                <Badge
                    w={'100px'}
                    variant='light'
                    color='gray'
                    style={{ cursor: 'pointer' }}
                    onClick={() => onViewDetails(info.row.original)}
                >
                    {info.getValue() ?? '—'}
                </Badge>
            ),
            enableSorting: true,
            meta: { sticky: 'left', stickyOffset: 34 },
        }),
        columnHelper.accessor('passenger', {
            id: 'passenger',
            header: 'Pasajero',
            cell: (info) => {
                const passenger = info.getValue();
                return (
                    <Stack gap={0} style={{ fontSize: "12px", overflow: 'hidden' }} w={'150px'}>
                        <Box w={'250px'}>
                            <Text
                                style={{
                                    cursor: 'pointer', textDecoration: 'none', color: 'var(--mantine-color-dark-9)',
                                    transition: 'color 0.2s'
                                }}
                                onClick={() => passenger && onViewClient(passenger as ClientType)}
                                fw={600}
                            >
                                {passenger?.fullName ?? '—'}
                            </Text>
                        </Box>
                        <Box w={'250px'}>{passenger?.email ?? '—'}</Box>
                        <Box w={'250px'}>{passenger?.passportNumber ?? '—'}</Box>
                    </Stack>
                )
            },
            enableSorting: false,
        }),
        columnHelper.accessor('createdBy', {
            id: 'createdBy',
            header: 'Creado por',
            cell: (info) => (
                <Stack gap={0} style={{ fontSize: "12px" }}>
                    <Box w={'150px'}>{info.getValue()?.name ?? '—'}</Box>
                    <Box w={'150px'}>{info.getValue()?.email ?? '—'}</Box>
                </Stack>
            ),
            enableSorting: false,
        }),
        columnHelper.accessor('ticketNumber', {
            id: 'ticketNumber',
            header: 'Reserva/Ticket',
            cell: (info) => {
                return (
                    <Stack gap={0} style={{ fontSize: "12px" }}>
                        <Box w={'150px'}>{info.getValue() ?? 'Sin Ticket'}</Box>
                        <Box w={'150px'}>{info.row.original.pnr ?? 'Sin PNR'}</Box>
                    </Stack>
                )
            },
            enableSorting: false,
        }),
        columnHelper.accessor('status', {
            id: 'status',
            header: 'Estado',
            cell: (info) => {
                const status = info.getValue()
                if (status == 'PENDING')
                    return (
                        <Stack w={'140px'} gap={2} align='center'>
                            <Badge variant="light" color="orange" radius="sm">PRERESERVA</Badge>
                            <CountdownTimer
                                createdAt={info.row.original.createdAt}
                                expiryHours={expiryHours}
                            />
                        </Stack>
                    )
                else if (status == 'REJECTED')
                    return <Badge variant="light" color="red" radius="sm">CANCELADA</Badge>
                else if (status == 'CONFIRMED')
                    return <Badge variant="light" color="green" radius="sm">CONFIRMADO</Badge>
            },
            enableSorting: true,
        }),
        columnHelper.accessor('invoiceAmount', {
            id: 'invoiceAmount',
            header: 'Precio',
            cell: (info) => <Box w={'150px'}>{info.getValue() ? `${info.getValue()} ${info.row.original.invoiceCurrency}` : '--'}</Box>,
            enableSorting: true,
        }),
        columnHelper.accessor('tripType', {
            id: 'tripType',
            header: 'Tipo de Envio',
            cell: (info) => <Badge w={'120px'} variant='light' color={info.getValue() == 'ONE_WAY' ? 'indigo' : 'pink'}>{info.getValue() == 'ONE_WAY' ? "Solo Ida" : "Ida y Vuelta"}</Badge>,
            enableSorting: true,
        }),
        columnHelper.accessor('departureFlights', {
            id: 'departureFlights',
            header: 'Ruta',
            cell: (info) => {
                const router = (info.getValue() || []) as any[]
                const iata_origin = router.length > 0 ? router[0].flight.origin : '-'
                const iata_origin_name = router.length > 0 ? router[0].flight.originName : '-'
                const iata_destination = router.length > 0 ? router[router.length - 1].flight.destination : '-'
                const iata_destinatio_name = router.length > 0 ? router[router.length - 1].flight.destinationName : '-'
                const scales = router.length - 1

                return (
                    <Stack gap={0} w={'90px'}>
                        <Flex gap={6}>
                            <Tooltip label={iata_origin_name}>
                                <Text style={{ fontSize: "12px" }} flex={1}>{iata_origin}</Text>
                            </Tooltip>
                            <IoAirplaneSharp size={14} color={primary[5]} />
                            <Tooltip label={iata_destinatio_name}>
                                <Text style={{ fontSize: "12px", textAlign: 'end' }} flex={1}>{iata_destination}</Text>
                            </Tooltip>
                        </Flex>
                        {scales > 0 && <Text style={{ fontSize: "12px" }}>({scales} escala)</Text>}
                    </Stack>
                )
            },
            enableSorting: false,
        }),
        columnHelper.accessor('departureFlights', {
            id: 'reserverDay',
            header: 'Fecha Reserva',
            cell: (info) => {
                const router = (info.getValue() || []) as any[]
                const departureTimeStr = router.length > 0 ? router[0].flight.departureTime : null
                const originTz = router.length > 0 ? (router[0].flight.originTimezone || 'UTC') : 'UTC';

                return (
                    <Box w={'180px'}>
                        {departureTimeStr
                            ? formatInTimeZone(new Date(departureTimeStr), originTz, 'd MMM yyyy, HH:mm', { locale: es })
                            : '-'
                        }
                    </Box>
                )
            },
            enableSorting: false,
        }),

        columnHelper.display({
            id: 'actions',
            header: '',
            cell: ({ row }) => {
                const target = row.original;
                const isConfirm = target.status == 'CONFIRMED' || target.status == 'REJECTED'
                return (
                    <Menu position="bottom-end" withArrow>
                        <Menu.Target>
                            <ActionIcon variant="subtle" color="gray">
                                <FiMoreVertical size={16} />
                            </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                            <Menu.Item leftSection={<FiEye size={14} />} onClick={() => onViewDetails(target)}>
                                Ver detalles
                            </Menu.Item>

                            {/* 🔒 FIX: Solo mostrar Confirmar y Cancelar si es Admin */}
                            {!isConfirm && isAdmin && (
                                <Menu.Item leftSection={<BsCheck size={14} />} color="green" onClick={() => onConfirm(target)}>
                                    Confirmar
                                </Menu.Item>
                            )}
                            {!isConfirm && isAdmin && (
                                <Menu.Item leftSection={<FiX size={14} />} color="red" onClick={() => onDelete(target)}>
                                    Cancelar
                                </Menu.Item>
                            )}

                            <Menu.Item leftSection={<FiEye size={14} />} onClick={() => onPreview(target)}>
                                Vista Previa PDF
                            </Menu.Item>
                            <Menu.Item leftSection={<BsFiletypePdf size={14} />} onClick={() => onDownloadPDF(target)}>
                                Descargar PDF
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                );
            },
            enableSorting: false,
            meta: { sticky: 'right' },
        }),
    ];