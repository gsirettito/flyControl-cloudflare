'use client';

import { Button } from '@mantine/core';
import { FiShare } from 'react-icons/fi';
import { useState } from 'react';
import { ExportModal } from '../ExportModal';

interface ButtonExportProps {
    apiUrl: string; // obligatorio
    filters: Record<string, any>;
    columns: any[];
    visibleColumnsIds: string[];
    include?: string;
}

export function ButtonExport({ apiUrl, filters, columns, visibleColumnsIds, include }: ButtonExportProps) {
    const [modalOpened, setModalOpened] = useState(false);

    const baseParams = {
        ...filters,
        include: include || undefined,
        sortBy: undefined,
        sortOrder: undefined,
        page: undefined,
        limit: undefined,
    };

    return (
        <>
            <Button variant="default" onClick={() => setModalOpened(true)} leftSection={<FiShare size={14} />}>
                Exportar
            </Button>
            <ExportModal
                apiUrl={apiUrl}
                opened={modalOpened}
                onClose={() => setModalOpened(false)}
                baseParams={baseParams}
                columns={columns}
                visibleColumnsIds={visibleColumnsIds}
            />
        </>
    );
}