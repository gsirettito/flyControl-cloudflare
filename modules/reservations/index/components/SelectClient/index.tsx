'use client';

import { useState, useEffect, useRef } from 'react';
import { Select, Loader } from '@mantine/core';
import { useSession } from 'next-auth/react';
import { ClientType } from '@/types/ModelsType';

interface SelectClientProps {
    value: string | null;
    onChange: (value: string | null) => void;
    error?: string;
    label?: string;
    placeholder?: string;
    required?: boolean;
    clearable?: boolean;
}

export const SelectClient = ({
    value,
    onChange,
    error,
    label = 'Seleccionar cliente',
    placeholder = 'Buscar por nombre o pasaporte',
    required = true,
    clearable = true,
}: SelectClientProps) => {
    const { data: session } = useSession();
    const [clients, setClients] = useState<{ value: string; label: string }[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    const loadClients = async (search: string) => {
        if (!session?.user) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: '1',
                limit: '20',
                sortBy: 'createdAt',
                sortOrder: 'desc',
            });
            if (search.trim()) {
                // Buscar por nombre o pasaporte (el backend debe soportar fullName:like y/o passportNumber:like)
                params.append('fullName:like', search.trim());
                // Opcional: también podrías buscar por pasaporte, pero con el OR necesitas ajustar backend
                // params.append('passportNumber:like', search.trim());
            }
            const response = await fetch(`/api/system/clients?${params.toString()}`);
            if (response.ok) {
                const result = await response.json();
                const items = result.data || [];
                const formatted = items.map((client: ClientType) => ({
                    value: client.id,
                    label: `${client.fullName} - ${client.passportNumber}`,
                }));
                setClients(formatted);
            } else {
                console.error('Error al cargar clientes');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Debounce para búsqueda
    useEffect(() => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            loadClients(searchTerm);
        }, 400);
        return () => {
            if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        };
    }, [searchTerm]);

    // Carga inicial sin búsqueda
    useEffect(() => {
        loadClients('');
    }, []);

    return (
        <Select
            label={label}
            placeholder={placeholder}
            data={clients}
            value={value}
            onChange={onChange}
            error={error}
            searchable
            onSearchChange={setSearchTerm}
            searchValue={searchTerm}
            nothingFoundMessage="No se encontraron clientes"
            rightSection={loading ? <Loader size="xs" /> : null}
            clearable={clearable}
            required={required}
        />
    );
};