'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Stack, TextInput, Divider, Card, Group, Badge, Text, Loader } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { FiSearch } from 'react-icons/fi';
import { FlightType, TripType } from '@/types/ModelsType';
import { useSession } from 'next-auth/react';
import { formatInTimeZone } from 'date-fns-tz'; // 🔥 Importamos formatInTimeZone

interface ModalSearchTravelProps {
    type: TripType;
    flights: FlightType[];
    opened: boolean;
    onClose: () => void;
    onChange: (flights: FlightType[]) => void;
}

export const ModalSearchTravel = ({
    type,
    flights,
    opened,
    onClose,
    onChange,
}: ModalSearchTravelProps) => {
    const { data: session } = useSession();
    const [searchText, setSearchText] = useState('');
    const [searchDate, setSearchDate] = useState<Date | null>(null);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<FlightType[]>([]);

    // Refs para mantener los valores actuales sin causar re-renders innecesarios
    const lastFlightRef = useRef(flights.length > 0 ? flights[flights.length - 1] : null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Actualizar la referencia cuando cambien los vuelos
    useEffect(() => {
        lastFlightRef.current = flights.length > 0 ? flights[flights.length - 1] : null;
    }, [flights]);

    // Obtener valores actuales desde las refs
    const getSuggestedOrigin = () => lastFlightRef.current?.destination || null;
    const getMinDate = () => lastFlightRef.current ? new Date(lastFlightRef.current.arrivalTime) : null;

    // Función de búsqueda estable (no depende de estados que cambien frecuentemente)
    const performSearch = useCallback(async (query: string, date: Date | null, origin: string | null) => {
        if (!session?.user) return;

        // Cancelar petición anterior
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setLoading(true);
        try {
            const params = new URLSearchParams({ page: '1', limit: '20', sortBy: 'departureTime', sortOrder: 'asc' });
            if (origin) params.append('origin:like', origin);
            if (query.trim() && (!origin || query.trim() !== origin)) {
                params.append('flightNumber:like', query.trim());
            }
            if (date) {
                let startISO: string, endISO: string;
                if (typeof date === 'string') {
                    startISO = `${date}T00:00:00.000Z`;
                    endISO = `${date}T23:59:59.999Z`;
                } else {
                    const d = new Date(date);
                    d.setUTCHours(0, 0, 0, 0);
                    startISO = d.toISOString();
                    const e = new Date(date);
                    e.setUTCHours(23, 59, 59, 999);
                    endISO = e.toISOString();
                }
                params.append('departureTime:between', `${startISO},${endISO}`);
            } else if (getMinDate()) {
                const minDate = getMinDate();
                if (minDate) {
                    params.append('departureTime:gte', minDate.toISOString());
                }
            }

            const response = await fetch(`/api/system/flights?${params.toString()}`, {
                signal: controller.signal,
            });
            if (!response.ok) {
                if (response.status !== 429) {
                    setResults([]);
                }
                return;
            }
            const result = await response.json();
            setResults(result.data || []);
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('Error en búsqueda:', error);
            }
        } finally {
            if (abortControllerRef.current === controller) {
                setLoading(false);
                abortControllerRef.current = null;
            }
        }
    }, [session]);

    // Búsqueda con debounce
    const debouncedSearch = useCallback((query: string, date: Date | null, origin: string | null) => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            performSearch(query, date, origin);
        }, 600);
    }, [performSearch]);

    // Manejar cambios en el input
    const handleSearchChange = (value: string) => {
        setSearchText(value);
        debouncedSearch(value, searchDate, getSuggestedOrigin());
    };

    const handleDateChange = (date: Date | null) => {
        setSearchDate(date);
        debouncedSearch(searchText, date, getSuggestedOrigin());
    };

    // Al abrir el modal: resetear y cargar vuelos sugeridos (solo una vez)
    useEffect(() => {
        if (opened) {
            const origin = getSuggestedOrigin();
            const minDate = getMinDate();
            const initialQuery = origin || '';
            setSearchText(initialQuery);
            setSearchDate(minDate);
            // Llamada inmediata sin debounce (solo al abrir)
            performSearch(initialQuery, minDate, origin);
        } else {
            // Limpiar al cerrar
            setSearchText('');
            setSearchDate(null);
            setResults([]);
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
        }
    }, [opened]);

    const handleAddFlight = (flight: FlightType) => {
        onChange([...flights, flight]);
        onClose();
    };

    const isReturn = type === 'ROUND_TRIP';

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={isReturn ? 'Agregar vuelo de regreso' : 'Agregar vuelo de ida'}
            size="lg"
        >
            <Stack>
                <TextInput
                    label="Buscar vuelo"
                    placeholder="Escribe número de vuelo o ciudad..."
                    value={searchText}
                    onChange={(e) => handleSearchChange(e.currentTarget.value)}
                    leftSection={<FiSearch size={16} />}
                    autoFocus
                    loading={loading}
                />
                <DatePickerInput
                    label="Fecha mínima de salida"
                    placeholder="Filtrar por fecha"
                    value={searchDate}
                    onChange={handleDateChange as any}
                    clearable
                    loading={loading}
                />
                <Divider />
                <Stack gap="xs">
                    {loading ? (
                        <Loader mx="auto" />
                    ) : results.length > 0 ? (
                        results.map((flight, index) => (
                            <Card
                                key={`flight-${index}`}
                                withBorder
                                p="xs"
                                onClick={() => handleAddFlight(flight)}
                                style={{ cursor: 'pointer' }}
                            >
                                <Group justify="space-between" wrap="wrap">
                                    <Badge>{flight.flightNumber}</Badge>
                                    <Text size="sm" fw={500}>
                                        {flight.origin} → {flight.destination}
                                    </Text>
                                    <Text size="xs">
                                        {/* 🔥 Usamos la zona horaria del origen dinámicamente */}
                                        🛫 {formatInTimeZone(new Date(flight.departureTime), flight.originTimezone || 'UTC', 'dd/MM/yyyy HH:mm')}
                                    </Text>
                                    <Text size="xs">
                                        {/* 🔥 Usamos la zona horaria del destino dinámicamente */}
                                        🛬 {formatInTimeZone(new Date(flight.arrivalTime), flight.destinationTimezone || 'UTC', 'dd/MM/yyyy HH:mm')}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        Asientos: {flight.availableSeats}
                                    </Text>
                                </Group>
                                <Text size="xs" c="dimmed" mt={4}>
                                    {flight.originName} → {flight.destinationName}
                                </Text>
                            </Card>
                        ))
                    ) : (
                        <Text c="dimmed" ta="center">
                            No se encontraron vuelos con esos criterios.
                        </Text>
                    )}
                </Stack>
            </Stack>
        </Modal>
    );
};