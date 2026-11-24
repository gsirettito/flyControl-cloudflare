'use client';

import { useState } from 'react';
import {
    Modal,
    Stack,
    Group,
    Button,
    Radio,
    Text,
    Divider,
    Checkbox,
    ScrollArea,
    Loader,
    Alert,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { FiDownload } from 'react-icons/fi';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

interface ExportModalProps {
    apiUrl: string;
    opened: boolean;
    onClose: () => void;
    baseParams: Record<string, any>;
    columns: any[];
    visibleColumnsIds: string[];
}

export function ExportModal({
    apiUrl,
    opened,
    onClose,
    baseParams,
    columns,
    visibleColumnsIds,
}: ExportModalProps) {
    const [dateRangeType, setDateRangeType] = useState<string>('last7Days');
    const [customRange, setCustomRange] = useState<[Date | null, Date | null]>([null, null]);
    const [selectedColumns, setSelectedColumns] = useState<string[]>(visibleColumnsIds);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getDateRange = (): { start: string | null; end: string | null } => {
        const now = dayjs().utc();
        let start: dayjs.Dayjs | null = null;
        let end: dayjs.Dayjs | null = now.endOf('day');

        switch (dateRangeType) {
            case 'today':
                start = now.startOf('day');
                break;
            case 'monthToDate':
                start = now.startOf('month');
                break;
            case 'last7Days':
                start = now.subtract(6, 'day').startOf('day');
                break;
            case 'last4Weeks':
                start = now.subtract(3, 'week').startOf('week');
                break;
            case 'lastMonth':
                start = now.subtract(1, 'month').startOf('month');
                end = now.subtract(1, 'month').endOf('month');
                break;
            case 'all':
                start = null;
                end = null;
                break;
            case 'custom':
                if (customRange[0] && customRange[1]) {
                    start = dayjs(customRange[0]).utc().startOf('day');
                    end = dayjs(customRange[1]).utc().endOf('day');
                } else {
                    start = null;
                    end = null;
                }
                break;
            default:
                start = null;
                end = null;
        }

        return {
            start: start ? start.toISOString() : null,
            end: end ? end.toISOString() : null,
        };
    };

    const buildExportParams = () => {
        const { start, end } = getDateRange();
        const params: Record<string, any> = {
            ...baseParams,
            limit: 100000,
            page: 1,
        };
        if (start && end) {
            params['createdAt:between'] = `${start},${end}`;
        } else if (start && !end) {
            params['createdAt:gte'] = start;
        } else if (!start && end) {
            params['createdAt:lte'] = end;
        }
        delete params.page;
        delete params.limit;
        return params;
    };

    const handleExport = async () => {
        setLoading(true);
        setError(null);
        try {
            const exportParams = buildExportParams();
            const url = new URL(apiUrl, window.location.origin);
            Object.entries(exportParams).forEach(([key, val]) => {
                if (val !== undefined && val !== null && val !== '') {
                    url.searchParams.append(key, String(val));
                }
            });
            const res = await fetch(url.toString());
            if (!res.ok) throw new Error(await res.text());
            const json = await res.json();
            const records = json.data;

            // Mapeo de columnas (mismo que antes, pero sin model)
            const columnsMap = new Map();
            for (const col of columns) {
                if (typeof col.header === 'string') {
                    columnsMap.set(col.id || col.header, { header: col.header, accessor: (row: any) => row[col.id] });
                }
            }

            const excelRows = records.map((row: any) => {
                const rowData: Record<string, any> = {};
                for (const colId of selectedColumns) {
                    const colInfo = columnsMap.get(colId);
                    if (colInfo) {
                        let value = colInfo.accessor(row);
                        if (colId === 'createdAt' && value) {
                            value = dayjs(value).format('YYYY-MM-DD HH:mm:ss');
                        }
                        rowData[colInfo.header] = value !== undefined && value !== null ? value : '';
                    }
                }
                return rowData;
            });

            const ws = XLSX.utils.json_to_sheet(excelRows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Datos');
            // Nombre de archivo sin model: usar timestamp y parte de la apiUrl
            const urlPath = apiUrl.replace(/^\/+|\/+$/g, '').replace(/\//g, '_');
            const fileName = `export_${urlPath}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
            XLSX.writeFile(wb, fileName);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Error al exportar');
        } finally {
            setLoading(false);
        }
    };

    const availableColumns = columns.filter(col => col.id && col.id !== 'select' && col.id !== 'actions' && col.header);

    return (
        <Modal opened={opened} onClose={onClose} title="Exportar datos" size="lg" centered>
            <Stack>
                <Text fw={500}>Intervalo de fechas</Text>
                <Radio.Group value={dateRangeType} onChange={setDateRangeType}>
                    <Stack gap="xs">
                        <Radio value="today" label="Hoy" />
                        <Radio value="monthToDate" label="Mes en curso" />
                        <Radio value="last7Days" label="Últimos 7 días" />
                        <Radio value="last4Weeks" label="Últimas 4 semanas" />
                        <Radio value="lastMonth" label="Último mes" />
                        <Radio value="all" label="Todos" />
                        <Radio value="custom" label="Personalizado" />
                    </Stack>
                </Radio.Group>
                {dateRangeType === 'custom' && (
                    <DatePickerInput
                        type="range"
                        label="Selecciona rango"
                        value={customRange}
                        onChange={setCustomRange as any}
                        clearable
                    />
                )}

                <Divider />

                <Text fw={500}>Columnas a exportar</Text>
                <ScrollArea h={300} offsetScrollbars>
                    <Stack gap="xs">
                        {availableColumns.map((col) => (
                            <Checkbox
                                key={col.id}
                                label={col.header}
                                checked={selectedColumns.includes(col.id)}
                                onChange={(e) => {
                                    if (e.currentTarget.checked) {
                                        setSelectedColumns([...selectedColumns, col.id]);
                                    } else {
                                        setSelectedColumns(selectedColumns.filter(c => c !== col.id));
                                    }
                                }}
                            />
                        ))}
                    </Stack>
                </ScrollArea>

                {error && (
                    <Alert color="red" title="Error">
                        {error}
                    </Alert>
                )}

                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={onClose}>Cancelar</Button>
                    <Button
                        leftSection={loading ? <Loader size="xs" /> : <FiDownload size={14} />}
                        onClick={handleExport}
                        disabled={loading}
                    >
                        Exportar
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}