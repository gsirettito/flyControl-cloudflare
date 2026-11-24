'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Flex, Stack, Title, Button, Container, Grid, Select, Paper, Loader,
    Text, Group, Alert,
    NumberInput
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { FiSearch } from 'react-icons/fi';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { ItemFlyInfo } from './components/ItemFlyInfo';
import { PaginationMain } from '@/components/Pagination';

dayjs.extend(utc);

export const ReservationDiscoveryIndex = () => {
    // ==================== Estados para Origen ====================
    const [originSearch, setOriginSearch] = useState('');
    const [originOptions, setOriginOptions] = useState<{ value: string; label: string }[]>([]);
    const [originLoading, setOriginLoading] = useState(false);
    const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);
    const originDebounce = useRef<NodeJS.Timeout | null>(null);

    // ==================== Estados para Destino ====================
    const [destinationSearch, setDestinationSearch] = useState('');
    const [destinationOptions, setDestinationOptions] = useState<{ value: string; label: string }[]>([]);
    const [destinationLoading, setDestinationLoading] = useState(false);
    const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
    const destinationDebounce = useRef<NodeJS.Timeout | null>(null);

    // ==================== Estados de búsqueda ====================
    const [tripType, setTripType] = useState<'round' | 'oneway'>('round');
    const [departureDate, setDepartureDate] = useState<Date | null>(null);
    const [returnDate, setReturnDate] = useState<Date | null>(null);
    const [adults, setAdults] = useState<number | undefined>(1);
    const [cabinClass, setCabinClass] = useState<string>('Economy');
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // ==================== Opciones de clases ====================
    const classOptions = [
        { value: 'Economy', label: 'Económica' },
        { value: 'PremiumEconomy', label: 'Premium Económica' },
        { value: 'Business', label: 'Business' },
        { value: 'First', label: 'Primera Clase' },
    ];

    // ==================== Búsqueda de aeropuertos ====================
    const searchAirports = async (query: string, setOptions: (opts: any[]) => void, setLoading: (loading: boolean) => void) => {
        if (!query.trim()) {
            setOptions([]);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/system/flight-api/airports?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data.results) {
                const formatted = data.results.map((airport: any) => ({
                    value: airport.iata,
                    label: `${airport.iata} - ${airport.name}, ${airport.city} (${airport.country})`
                }));
                setOptions(formatted);
            } else {
                setOptions([]);
            }
        } catch (error) {
            console.error('Error buscando aeropuertos:', error);
            setOptions([]);
        } finally {
            setLoading(false);
        }
    };

    // Debounce para Origen
    useEffect(() => {
        if (originDebounce.current) clearTimeout(originDebounce.current);
        originDebounce.current = setTimeout(() => {
            searchAirports(originSearch, setOriginOptions, setOriginLoading);
        }, 400);
        return () => {
            if (originDebounce.current) clearTimeout(originDebounce.current);
        };
    }, [originSearch]);

    // Debounce para Destino
    useEffect(() => {
        if (destinationDebounce.current) clearTimeout(destinationDebounce.current);
        destinationDebounce.current = setTimeout(() => {
            searchAirports(destinationSearch, setDestinationOptions, setDestinationLoading);
        }, 400);
        return () => {
            if (destinationDebounce.current) clearTimeout(destinationDebounce.current);
        };
    }, [destinationSearch]);

    // ==================== Búsqueda de vuelos ====================
    const handleSearch = async () => {
        // Validaciones básicas
        if (!selectedOrigin) {
            setSearchError('Selecciona un origen');
            return;
        }
        if (!selectedDestination) {
            setSearchError('Selecciona un destino');
            return;
        }
        if (!departureDate) {
            setSearchError('Selecciona una fecha de salida');
            return;
        }
        if (tripType === 'round' && !returnDate) {
            setSearchError('Selecciona una fecha de regreso');
            return;
        }

        setSearchLoading(true);
        setSearchError(null);
        setSearchResults([]);
        setCurrentPage(1); // Reiniciar paginación

        try {
            const params = new URLSearchParams();
            params.append('origin', selectedOrigin);
            params.append('destination', selectedDestination);
            params.append('date', dayjs(departureDate).format('YYYY-MM-DD'));
            params.append('adults', (adults || 1).toString());
            params.append('currency', 'USD');
            params.append('cabin_class', cabinClass);
            if (tripType === 'round' && returnDate) {
                params.append('return_date', dayjs(returnDate).format('YYYY-MM-DD'));
            }

            const response = await fetch(`/api/system/flight-api/flights-from-to?${params.toString()}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al buscar vuelos');
            }

            // La API devuelve un objeto con la propiedad "flights" (según ejemplo)
            console.log("FLi", data.flights)
            setSearchResults(data.flights || []);
        } catch (error: any) {
            console.error('Error en búsqueda:', error);
            setSearchError(error.message || 'Ocurrió un error al buscar vuelos');
        } finally {
            setSearchLoading(false);
        }
    };

    // ==================== Paginación ====================
    const totalPages = Math.ceil(searchResults.length / itemsPerPage);
    const paginatedResults = searchResults.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <Stack gap="xl">
            <Flex justify="space-between" align="center" wrap="wrap">
                <Title order={1} flex={1}>Descubre Vuelos</Title>
            </Flex>

            <Stack gap={0}>
                {/* Filtros */}
                <Paper withBorder radius="md" p="lg">
                    <Grid>
                        <Grid.Col span={{ base: 12, sm: 6, md: 6 }}>
                            <Select
                                label="Origen"
                                placeholder="Buscar aeropuerto"
                                data={originOptions}
                                searchable
                                onSearchChange={setOriginSearch}
                                searchValue={originSearch}
                                value={selectedOrigin}
                                onChange={setSelectedOrigin}
                                nothingFoundMessage="No se encontraron aeropuertos"
                                rightSection={originLoading ? <Loader size="xs" /> : null}
                                clearable
                            />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6, md: 6 }}>
                            <Select
                                label="Destino"
                                placeholder="Buscar aeropuerto"
                                data={destinationOptions}
                                searchable
                                onSearchChange={setDestinationSearch}
                                searchValue={destinationSearch}
                                value={selectedDestination}
                                onChange={setSelectedDestination}
                                nothingFoundMessage="No se encontraron aeropuertos"
                                rightSection={destinationLoading ? <Loader size="xs" /> : null}
                                clearable
                            />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
                            <Select
                                label="Tipo de viaje"
                                placeholder="Selecciona"
                                data={[
                                    { value: 'round', label: 'Ida y vuelta' },
                                    { value: 'oneway', label: 'Solo ida' },
                                ]}
                                value={tripType}
                                onChange={(value) => setTripType(value as 'round' | 'oneway')}
                            />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
                            <DatePickerInput
                                label="Fecha de salida"
                                placeholder="Selecciona una fecha"
                                clearable
                                value={departureDate}
                                onChange={setDepartureDate as any}
                            />
                        </Grid.Col>
                        {tripType === 'round' && (
                            <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
                                <DatePickerInput
                                    label="Fecha de regreso"
                                    placeholder="Selecciona una fecha"
                                    clearable
                                    value={returnDate}
                                    onChange={setReturnDate as any}
                                />
                            </Grid.Col>
                        )}
                        <Grid.Col span={{ base: 12, sm: 6, md: 1 }}>
                            <NumberInput
                                label="Adultos"
                                placeholder="1"
                                min={1}
                                max={9}
                                value={adults}
                                onChange={setAdults as any}
                            />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
                            <Select
                                label="Clase"
                                placeholder="Clase"
                                data={classOptions}
                                value={cabinClass}
                                onChange={(val) => setCabinClass(val || 'Economy')}
                            />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 2 }} style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <Button
                                fullWidth
                                leftSection={<FiSearch size={16} />}
                                onClick={handleSearch}
                                loading={searchLoading}
                            >
                                Buscar
                            </Button>
                        </Grid.Col>
                    </Grid>
                </Paper>

                {/* Resultados */}
                <Stack gap="0" mt="xl">
                    {searchLoading && (
                        <Flex justify="center" align="center" py="xl">
                            <Loader size="lg" />
                            <Text ml="md">Buscando vuelos...</Text>
                        </Flex>
                    )}

                    {searchError && (
                        <Alert variant='transparent' color="red" title="Error">
                            {searchError}
                        </Alert>
                    )}

                    {!searchLoading && !searchError && paginatedResults.length === 0 && (
                        <Alert variant='transparent' color="blue" title="Sin resultados">
                            No se encontraron vuelos para los criterios seleccionados.
                        </Alert>
                    )}

                    {!searchLoading && !searchError && paginatedResults.map((flight, idx) => (
                        <ItemFlyInfo key={idx} flight={flight} tripType={tripType} />
                    ))}
                </Stack>

                {/* Paginación */}
                {!searchLoading && !searchError && totalPages > 1 && (
                    <Flex justify="center" mt="xl">
                        <PaginationMain
                            total={searchResults.length}
                            limit={itemsPerPage}
                            page={currentPage}
                            onPageSelect={setCurrentPage}
                        />
                    </Flex>
                )}
            </Stack>
        </Stack>
    );
};