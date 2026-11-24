import { createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ActionIcon, Badge, Checkbox, Menu, Stack, Image, Group, ColorSwatch } from '@mantine/core';
import { CompanyType } from '@/types/ModelsType';
import { FiMoreVertical, FiEdit, FiTrash2 } from 'react-icons/fi';

const columnHelper = createColumnHelper<CompanyType>();

// 🔒 FIX: Añadimos isSuperAdmin como primer parámetro
export const getColumns = (
    isSuperAdmin: boolean,
    onEdit: (company: CompanyType) => void,
    onDelete: (company: CompanyType) => void
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
                return url ? <Image src={url} w={40} h={40} fit="contain" radius="sm" /> : <Badge color="gray">Sin logo</Badge>;
            },
            enableSorting: false,
        }),
        columnHelper.accessor('commercialName', {
            id: 'commercialName',
            header: 'Nombre Comercial',
            cell: (info) => info.getValue(),
            enableSorting: true,
        }),
        columnHelper.accessor('ticketPrefix', {
            id: 'ticketPrefix',
            header: 'Prefijo Ticket',
            cell: (info) => <Badge color="blue" variant="light">{info.getValue()}</Badge>,
            enableSorting: true,
        }),
        columnHelper.accessor('primaryColor', {
            id: 'colores',
            header: 'Colores',
            cell: (info) => (
                <Group gap="xs">
                    <ColorSwatch color={info.getValue() || '#000000'} size={20} />
                    <ColorSwatch color={info.row.original.secondaryColor || '#ffffff'} size={20} />
                    <ColorSwatch color={info.row.original.textColor || '#000000'} size={20} />
                </Group>
            ),
            enableSorting: false,
        }),
        columnHelper.accessor('createdAt', {
            id: 'createdAt',
            header: 'Fecha de creación',
            cell: (info) => <Stack w={'150px'}>{format(new Date(info.getValue()), 'd MMM yyyy, HH:mm', { locale: es })}</Stack>,
            enableSorting: true,
        }),
        columnHelper.display({
            id: 'actions',
            header: '',
            cell: ({ row }) => {
                const company = row.original;
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
                                    <Menu.Item leftSection={<FiEdit size={14} />} onClick={() => onEdit(company)}>
                                        Editar
                                    </Menu.Item>
                                    <Menu.Item leftSection={<FiTrash2 size={14} />} color="red" onClick={() => onDelete(company)}>
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