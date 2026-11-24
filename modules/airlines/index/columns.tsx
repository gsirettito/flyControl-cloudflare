import { createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ActionIcon, Badge, Checkbox, Menu, Stack, Image, Text } from '@mantine/core';
import { AirlineType } from '@/types/ModelsType';
import { FiMoreVertical, FiEdit, FiTrash2 } from 'react-icons/fi';

const columnHelper = createColumnHelper<AirlineType>();

// 🔒 FIX: Añadimos isSuperAdmin como primer parámetro
export const getColumns = (
    isSuperAdmin: boolean,
    onEdit: (airline: AirlineType) => void,
    onDelete: (airline: AirlineType) => void
) => [
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
        columnHelper.accessor('logoUrl', {
            id: 'logoUrl',
            header: 'Logo',
            cell: (info) => {
                const url = info.getValue();
                return url ? <Image src={url} w={40} h={40} fit="contain" radius="sm" /> : <Text size="xs" c="dimmed">Sin logo</Text>;
            },
            enableSorting: false,
        }),
        columnHelper.accessor('iata', {
            id: 'iata',
            header: 'IATA / ICAO',
            cell: (info) => (
                <Stack gap={0}>
                    <Text fw={600}>{info.getValue()}</Text>
                    <Text size="xs" c="dimmed">{info.row.original.icao}</Text>
                </Stack>
            ),
            enableSorting: true,
        }),
        columnHelper.accessor('displayName', {
            id: 'displayName',
            header: 'Aerolínea',
            cell: (info) => (
                <Stack gap={0}>
                    <Text fw={500}>{info.getValue()}</Text>
                    <Text size="xs" c="dimmed">{info.row.original.officialName}</Text>
                </Stack>
            ),
            enableSorting: true,
        }),
        columnHelper.accessor('active', {
            id: 'active',
            header: 'Estado',
            cell: (info) => (
                <Badge color={info.getValue() ? 'green' : 'red'} variant="light">
                    {info.getValue() ? 'Activa' : 'Inactiva'}
                </Badge>
            ),
            enableSorting: true,
        }),
        columnHelper.display({
            id: 'actions',
            header: '',
            cell: ({ row }) => {
                const airline = row.original;
                return (
                    <Menu position="bottom-end" withArrow>
                        <Menu.Target>
                            <ActionIcon variant="subtle" color="gray">
                                <FiMoreVertical size={16} />
                            </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                            {/* 🔒 FIX: Solo renderizamos las acciones si es SuperAdmin */}
                            {isSuperAdmin ? (
                                <>
                                    <Menu.Item leftSection={<FiEdit size={14} />} onClick={() => onEdit(airline)}>
                                        Editar
                                    </Menu.Item>
                                    <Menu.Item leftSection={<FiTrash2 size={14} />} color="red" onClick={() => onDelete(airline)}>
                                        Eliminar
                                    </Menu.Item>
                                </>
                            ) : (
                                <Menu.Item disabled>Sin acciones disponibles</Menu.Item>
                            )}
                        </Menu.Dropdown>
                    </Menu>
                );
            },
            enableSorting: false,
            meta: { sticky: 'right' },
        }),
    ];