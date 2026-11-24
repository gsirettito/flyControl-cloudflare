// modules/invoices/columns.tsx
import { createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ActionIcon, Badge, Checkbox, Menu, Text, Stack, Box } from '@mantine/core';
import { FiMoreVertical, FiDownload, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const columnHelper = createColumnHelper<any>();

export const getColumns = (
    onMarkAsPaid: (invoice: any) => void,
    onCancel: (invoice: any) => void,
    onDownloadPDF: (invoice: any) => void
) => [
        // 🔥 Restauramos la columna de selección (necesaria para el DataTable)
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
        columnHelper.accessor('invoiceNumber', {
            id: 'invoiceNumber',
            header: 'Nº Factura',
            cell: (info) => (
                <Box w={'150px'}>
                    <Text
                        style={{
                            cursor: 'pointer', textDecoration: 'none', color: 'var(--mantine-color-dark-9)',
                            transition: 'color 0.2s'
                        }}
                        onClick={() => onDownloadPDF(info.row.original)}
                        fw={500}
                    >
                        {info.getValue() ?? '—'}
                    </Text>
                </Box>
            ),
            enableSorting: true,
            meta: { sticky: 'left', stickyOffset: 34 },
        }),
        // 🔥 Usamos accessor 'client' en lugar de 'client.fullName' para que no falle si es null
        columnHelper.accessor('client', {
            id: 'client',
            header: 'Cliente / Reserva',
            cell: (info) => (
                <div>
                    <Text size="sm">{info.getValue()?.fullName || '—'}</Text>
                    {info.row.original.reservation && (
                        <Text size="xs" c="dimmed">Ref: {info.row.original.reservation.reservationCode}</Text>
                    )}
                </div>
            ),
            enableSorting: false,
        }),
        columnHelper.accessor('description', {
            id: 'description',
            header: 'Descripción',
            cell: (info) => <Text size="sm" lineClamp={1} maw={250}>{info.getValue()}</Text>,
            enableSorting: false,
        }),
        columnHelper.accessor('totalAmount', {
            id: 'amount',
            header: 'Total',
            // 🔥 Protegemos por si el monto viene nulo
            cell: (info) => {
                const value = info.getValue();
                return <Text fw={600}>{(value || 0).toFixed(2)} {info.row.original.currency}</Text>
            },
            enableSorting: true,
        }),
        columnHelper.accessor('status', {
            id: 'status',
            header: 'Estado',
            cell: (info) => {
                const status = info.getValue();
                const color = status === 'PAID' ? 'green' : status === 'CANCELLED' ? 'red' : 'orange';
                const label = status === 'PAID' ? 'PAGADA' : status === 'CANCELLED' ? 'CANCELADA' : 'PENDIENTE';

                return <Badge color={color} variant="light">{label}</Badge>;
            },
            enableSorting: true,
        }),
        columnHelper.display({
            id: 'actions',
            header: '',
            cell: ({ row }) => {
                const inv = row.original;
                const isPending = inv.status === 'PENDING';

                return (
                    <Menu position="bottom-end" withArrow>
                        <Menu.Target>
                            <ActionIcon variant="subtle" color="gray">
                                <FiMoreVertical size={16} />
                            </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                            <Menu.Item leftSection={<FiDownload size={14} />} onClick={() => onDownloadPDF(inv)}>
                                Descargar PDF
                            </Menu.Item>
                            {isPending && (
                                <Menu.Item leftSection={<FiCheckCircle size={14} />} color="green" onClick={() => onMarkAsPaid(inv)}>
                                    Marcar como Pagada
                                </Menu.Item>
                            )}
                            {isPending && (
                                <Menu.Item leftSection={<FiXCircle size={14} />} color="red" onClick={() => onCancel(inv)}>
                                    Cancelar Factura
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