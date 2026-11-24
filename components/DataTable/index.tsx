'use client';

import {
    Table,
    Select,
    TextInput,
    Group,
    Button,
    Stack,
    LoadingOverlay,
    Box,
    Flex,
} from '@mantine/core';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useDataTable } from './hooks/useDataTable';
import { PaginationMain } from '../Pagination';
import { FiChevronDown, FiChevronUp, FiAlignJustify } from 'react-icons/fi';
import { TbGripVertical } from "react-icons/tb";
import { useState, useEffect, useImperativeHandle, forwardRef, useCallback, useMemo } from 'react';
import { ButtonExport } from './components/ButtonExport';
// DnD imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DataTableProps {
    apiUrl: string;
    columns: any[];
    initialParams?: Record<string, any>;
    globalFilterPlaceholder?: string;
    enableGlobalFilter?: boolean;
    forcedFilters?: Record<string, any>;
    renderFilters?: (filters: Record<string, any>, setColumnFilter: (id: string, value: any) => void) => React.ReactNode;
    onSelectedRowsChange?: (selectedRows: any[]) => void;
    fetchDataFn?: (params: Record<string, any>) => Promise<any>;
    // Nuevas props para ordenamiento de columnas
    enableColumnOrdering?: boolean;
    columnOrderStorageKey?: string;
    excludeFromColumnOrdering?: string[]; // ids de columnas que NO se podrán reordenar
}

export interface DataTableRef {
    refresh: (newParams?: Record<string, any>) => Promise<any>;
    resetColumnOrder?: () => void; // opcional: exponer función para resetear orden
}

// Componente para el encabezado arrastrable
function SortableHeader({ header, isDraggable }: { header: any; isDraggable: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: header.id, disabled: !isDraggable });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: isDraggable ? 'grab' : 'default',
        position: 'relative' as const,
        // Mantener sticky si está configurado
        ...(header.column.columnDef.meta?.sticky ? {
            position: 'sticky',
            left: header.column.columnDef.meta?.sticky === 'left' ? (header.column.columnDef.meta?.stickyOffset || 0) : undefined,
            right: header.column.columnDef.meta?.sticky === 'right' ? 0 : undefined,
            backgroundColor: 'var(--mantine-color-body)',
            zIndex: isDragging ? 1000 : 2,
        } : {}),
    };

    const sticky = header.column.columnDef.meta?.sticky;
    const offset = header.column.columnDef.meta?.stickyOffset || 0;
    let stickyStyle = {};
    if (sticky === 'left') {
        stickyStyle = { position: 'sticky', left: offset, backgroundColor: 'var(--mantine-color-body)', zIndex: 2 };
    } else if (sticky === 'right') {
        stickyStyle = { position: 'sticky', right: 0, backgroundColor: 'var(--mantine-color-body)', zIndex: 2 };
    }

    return (
        <Table.Th
            ref={setNodeRef}
            style={{ ...style, ...stickyStyle, cursor: isDraggable ? 'grab' : 'pointer', background: 'var(--mantine-color-gray-0)' } as any}
            onClick={!isDragging ? header.column.getToggleSortingHandler() : undefined}
        >
            <Flex gap={4} align="center">
                {isDraggable && (
                    <div {...attributes} {...listeners} style={{ cursor: 'grab', display: 'inline-flex' }}>
                        <TbGripVertical size={14} color='gray' />
                    </div>
                )}
                <Flex gap={2} style={{ alignItems: 'center', whiteSpace: 'nowrap' }}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() ? (
                        {
                            asc: <FiChevronUp size={14} style={{ marginLeft: 4 }} />,
                            desc: <FiChevronDown size={14} style={{ marginLeft: 4 }} />,
                        }[header.column.getIsSorted() as string] ?? (
                            <Stack gap={-0}>
                                <FiChevronUp color="gray" size={10} style={{ marginLeft: 4 }} />
                                <FiChevronDown color="gray" size={10} style={{ marginLeft: 4 }} />
                            </Stack>
                        )
                    ) : null}
                </Flex>
            </Flex>
        </Table.Th>
    );
}

export const DataTable = forwardRef<DataTableRef, DataTableProps>(function DataTable(
    {
        apiUrl,
        columns,
        initialParams,
        forcedFilters = {},
        globalFilterPlaceholder,
        enableGlobalFilter,
        renderFilters,
        onSelectedRowsChange,
        fetchDataFn,
        enableColumnOrdering = false,
        columnOrderStorageKey,
        excludeFromColumnOrdering = [],
    },
    ref
) {
    const [rowSelection, setRowSelection] = useState({});
    // Estado para el orden de las columnas
    const [columnOrder, setColumnOrder] = useState<string[]>([]);
    // Obtener ids de todas las columnas (incluye 'select', 'actions' y las definidas)
    const allColumnIds = useMemo(() => columns.map(col => col.id || col.accessorKey).filter(Boolean), [columns]);

    // Calcular ids que son reordenables (excluir las que están en excludeFromColumnOrdering)
    const reorderableColumnIds = useMemo(() =>
        allColumnIds.filter(id => !excludeFromColumnOrdering.includes(id)),
        [allColumnIds, excludeFromColumnOrdering]
    );

    // Cargar orden guardado desde localStorage
    useEffect(() => {
        if (!enableColumnOrdering) return;
        const storageKey = columnOrderStorageKey || `table_column_order_${apiUrl.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const savedOrder = localStorage.getItem(storageKey);
        if (savedOrder) {
            try {
                const parsed = JSON.parse(savedOrder) as string[];
                // Validar que todos los ids guardados existan en las columnas actuales
                const validOrder = parsed.filter(id => allColumnIds.includes(id));
                // Agregar al final las columnas nuevas que no estén en el orden guardado
                const missingIds = allColumnIds.filter(id => !validOrder.includes(id));
                setColumnOrder([...validOrder, ...missingIds]);
            } catch (e) {
                console.warn('Error parsing column order from localStorage', e);
                setColumnOrder(allColumnIds);
            }
        } else {
            setColumnOrder(allColumnIds);
        }
    }, [enableColumnOrdering, apiUrl, columnOrderStorageKey, allColumnIds]);

    // Guardar orden en localStorage cuando cambie
    useEffect(() => {
        if (!enableColumnOrdering || columnOrder.length === 0) return;
        const storageKey = columnOrderStorageKey || `table_column_order_${apiUrl.replace(/[^a-zA-Z0-9]/g, '_')}`;
        localStorage.setItem(storageKey, JSON.stringify(columnOrder));
    }, [columnOrder, enableColumnOrdering, apiUrl, columnOrderStorageKey]);

    // Función para resetear el orden de columnas al original (el de las props)
    const resetColumnOrder = useCallback(() => {
        setColumnOrder(allColumnIds);
    }, [allColumnIds]);

    // Sensores para DnD
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 }, // evitar arrastres accidentales al hacer clic
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = columnOrder.indexOf(active.id as string);
            const newIndex = columnOrder.indexOf(over?.id as string);
            if (oldIndex !== -1 && newIndex !== -1) {
                const newOrder = arrayMove(columnOrder, oldIndex, newIndex);
                setColumnOrder(newOrder);
            }
        }
    };

    // Hook de datos
    const {
        data,
        pagination,
        isLoading,
        handleSort,
        handlePageChange,
        handleLimitChange,
        setColumnFilter,
        setGlobalFilter,
        resetFilters,
        sortBy,
        sortOrder,
        filters,
        globalFilter,
        refetch,
        updateFilters,
    } = useDataTable(apiUrl, initialParams, forcedFilters, { fetchDataFn });

    // Crear la tabla con el orden de columnas
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        manualSorting: true,
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting: sortBy ? [{ id: sortBy, desc: sortOrder === 'desc' }] : [],
            rowSelection,
            columnOrder: enableColumnOrdering ? columnOrder : undefined, // solo si está habilitado
        },
        onColumnOrderChange: enableColumnOrdering ? setColumnOrder : undefined,
        onSortingChange: (updater) => {
            const newSorting = typeof updater === 'function' ? updater([]) : updater;
            if (newSorting[0]) {
                handleSort(newSorting[0].id);
            } else {
                handleSort('');
            }
        },
    });

    // Notificar selección
    useEffect(() => {
        if (onSelectedRowsChange) {
            const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
            onSelectedRowsChange(selectedRows);
        }
    }, [rowSelection, onSelectedRowsChange, table]);

    // Exponer funciones al padre
    useImperativeHandle(ref, () => ({
        refresh: async (newParams?: Record<string, any>) => {
            if (newParams) {
                updateFilters(newParams);
            }
            const result = await refetch();
            return result.data;
        },
        resetColumnOrder: enableColumnOrdering ? resetColumnOrder : undefined,
    }));

    const pageSizeOptions = [5, 10, 25, 50, 100];

    // Obtener los grupos de encabezados respetando el orden actual (la tabla ya lo hace)
    const headerGroups = table.getHeaderGroups();

    return (
        <Stack pos="relative">
            <LoadingOverlay visible={isLoading} />
            <Stack>
                <Group justify="space-between" align="flex-start">
                    {enableGlobalFilter && (
                        <TextInput
                            placeholder={globalFilterPlaceholder}
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.currentTarget.value)}
                            style={{ width: 300 }}
                        />
                    )}
                    <Flex w={"100%"} direction={{ base: 'column', md: 'row' }} gap={{ base: 6, md: 12 }}>
                        <Group gap={4} flex={3}>
                            {renderFilters && renderFilters(filters, setColumnFilter)}
                        </Group>
                        <Flex gap={4} flex={1} style={{ justifyContent: "end" }}>
                            <ButtonExport
                                apiUrl={apiUrl}
                                filters={filters}
                                columns={columns}
                                visibleColumnsIds={table.getAllColumns().filter(col => col.getIsVisible()).map(col => col.id)}
                                include={initialParams?.include}
                            />
                            {enableColumnOrdering && (
                                <Button variant="default" onClick={resetColumnOrder}>
                                    Restaurar orden
                                </Button>
                            )}
                            <Button variant="default" onClick={resetFilters}>
                                Limpiar filtros
                            </Button>
                        </Flex>
                    </Flex>
                </Group>

                <Box style={{ overflowX: 'auto' }}>
                    {enableColumnOrdering ? (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={columnOrder}
                                strategy={horizontalListSortingStrategy}
                            >
                                <Table>
                                    <Table.Thead>
                                        {headerGroups.map((headerGroup) => (
                                            <Table.Tr key={headerGroup.id}>
                                                {headerGroup.headers.map((header) => {
                                                    const isDraggable = reorderableColumnIds.includes(header.id);
                                                    return (
                                                        <SortableHeader
                                                            key={header.id}
                                                            header={header}
                                                            isDraggable={isDraggable}
                                                        />
                                                    );
                                                })}
                                            </Table.Tr>
                                        ))}
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {table.getRowModel().rows.map((row) => (
                                            <Table.Tr key={row.id}>
                                                {row.getVisibleCells().map((cell) => {
                                                    const sticky = (cell.column.columnDef.meta as any)?.sticky || 0;
                                                    const offset = (cell.column.columnDef.meta as any)?.stickyOffset || 0;
                                                    let stickyStyle = {};
                                                    if (sticky === 'left') {
                                                        stickyStyle = {
                                                            position: 'sticky',
                                                            left: offset,
                                                            backgroundColor: 'var(--mantine-color-body)',
                                                            zIndex: 2
                                                        };
                                                    } else if (sticky === 'right') {
                                                        stickyStyle = {
                                                            position: 'sticky',
                                                            right: 0,
                                                            backgroundColor: 'var(--mantine-color-body)',
                                                            zIndex: 1,
                                                        };
                                                    }
                                                    return (
                                                        <Table.Td key={cell.id} style={stickyStyle}>
                                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                        </Table.Td>
                                                    );
                                                })}
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            </SortableContext>
                        </DndContext>
                    ) : (
                        <Table>
                            <Table.Thead>
                                {headerGroups.map((headerGroup) => (
                                    <Table.Tr key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => {
                                            const sticky = (header.column.columnDef.meta as any)?.sticky || 0;
                                            const offset = (header.column.columnDef.meta as any)?.stickyOffset || 0;
                                            let stickyStyle = {};
                                            if (sticky === 'left') {
                                                stickyStyle = {
                                                    position: 'sticky',
                                                    left: offset,
                                                    backgroundColor: 'var(--mantine-color-body)',
                                                    zIndex: 2
                                                };
                                            } else if (sticky === 'right') {
                                                stickyStyle = {
                                                    position: 'sticky',
                                                    right: 0,
                                                    backgroundColor: 'var(--mantine-color-body)',
                                                    zIndex: 2,
                                                };
                                            }
                                            return (
                                                <Table.Th
                                                    key={header.id}
                                                    onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                                                    style={{
                                                        cursor: header.column.getCanSort() ? 'pointer' : 'default',
                                                        ...stickyStyle,
                                                    }}
                                                >
                                                    <Flex gap={2} style={{ alignItems: 'center' }}>
                                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                                        {header.column.getCanSort() ? (
                                                            {
                                                                asc: <FiChevronUp size={14} style={{ marginLeft: 4 }} />,
                                                                desc: <FiChevronDown size={14} style={{ marginLeft: 4 }} />,
                                                            }[header.column.getIsSorted() as string] ?? (
                                                                <Stack gap={-0}>
                                                                    <FiChevronUp color="gray" size={10} style={{ marginLeft: 4 }} />
                                                                    <FiChevronDown color="gray" size={10} style={{ marginLeft: 4 }} />
                                                                </Stack>
                                                            )
                                                        ) : null}
                                                    </Flex>
                                                </Table.Th>
                                            );
                                        })}
                                    </Table.Tr>
                                ))}
                            </Table.Thead>
                            <Table.Tbody>
                                {table.getRowModel().rows.map((row) => (
                                    <Table.Tr key={row.id}>
                                        {row.getVisibleCells().map((cell) => {
                                            const sticky = (cell.column.columnDef.meta as any)?.sticky || 0;
                                            const offset = (cell.column.columnDef.meta as any)?.stickyOffset || 0;
                                            let stickyStyle = {};
                                            if (sticky === 'left') {
                                                stickyStyle = {
                                                    position: 'sticky',
                                                    left: offset,
                                                    backgroundColor: 'var(--mantine-color-body)',
                                                    zIndex: 2
                                                };
                                            } else if (sticky === 'right') {
                                                stickyStyle = {
                                                    position: 'sticky',
                                                    right: 0,
                                                    backgroundColor: 'var(--mantine-color-body)',
                                                    zIndex: 1,
                                                };
                                            }
                                            return (
                                                <Table.Td key={cell.id} style={stickyStyle}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </Table.Td>
                                            );
                                        })}
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    )}
                </Box>

                <Group justify="space-between" mt="md">
                    <Select
                        value={String(pagination.limit)}
                        onChange={(val) => handleLimitChange(Number(val))}
                        data={pageSizeOptions.map((size) => ({
                            value: String(size),
                            label: `${size} / página`,
                        }))}
                        style={{ width: 140 }}
                    />
                    <PaginationMain
                        total={pagination.total}
                        limit={pagination.limit}
                        page={pagination.page}
                        onPageSelect={handlePageChange}
                    />
                </Group>
            </Stack>
        </Stack>
    );
});