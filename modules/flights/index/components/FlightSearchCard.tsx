import { Card, Title, Stack, TextInput, Text, Button, Alert } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { useState } from 'react';

interface FlightSearchCardProps {
    /* flightNumberSearch: string;
    setFlightNumberSearch: React.Dispatch<React.SetStateAction<string>>;
    departureDateSearch: Date | null;
    setDepartureDateSearch: React.Dispatch<React.SetStateAction<Date | null>>;
    searchFlight: () => void;
    searchLoading: boolean;
    searchError: string | null;
    setSearchError: React.Dispatch<React.SetStateAction<string | null>>; */
    onSearchChange: (search: any[]) => void
}

export const FlightSearchCard = ({
    /* flightNumberSearch, setFlightNumberSearch, departureDateSearch, setDepartureDateSearch,
    searchFlight, searchLoading, searchError, setSearchError */
    onSearchChange
}: FlightSearchCardProps) => {

    const [flightNumberSearch, setFlightNumberSearch] = useState("");
    const [departureDateSearch, setDepartureDateSearch] = useState<Date | null>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    const searchFlight = async () => {
        if (!flightNumberSearch.trim() || !departureDateSearch) { setSearchError("Ingrese número de vuelo y fecha de salida"); return; }
        setSearchLoading(true); setSearchError(null); onSearchChange([]); /* setSearchResults([]); setSelectedFlightIndex(null) */;
        try {
            let formattedDate: string;
            if (typeof departureDateSearch === 'string') formattedDate = departureDateSearch;
            else if (departureDateSearch instanceof Date) formattedDate = departureDateSearch.toISOString().split('T')[0];
            else throw new Error('Formato de fecha inválido');

            const response = await fetch(`/api/system/flight-api?flight_number=${flightNumberSearch.toUpperCase()}&date_from=${formattedDate}&date_to=${formattedDate}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error en la búsqueda");
            }
            const result = await response.json();
            if (!result.flights || result.flights.length === 0) { setSearchError("No se encontraron vuelos para ese día"); return; }
            onSearchChange(result.flights);
            /* setSearchResults(result.flights); */
        } catch (error: any) { console.error(error); setSearchError(error.message || "No se pudo encontrar el vuelo"); }
        finally { setSearchLoading(false); }
    };

    return (
        <Card withBorder radius="md" p="md">
            <Title order={4} mb="md">Buscar vuelo por número y fecha</Title>
            <Stack gap="sm">
                <TextInput
                    label="Número de vuelo"
                    placeholder="CM123"
                    value={flightNumberSearch}
                    onChange={(e) => setFlightNumberSearch(e.currentTarget.value.toUpperCase())}
                    style={{ textTransform: 'uppercase' }}
                />
                <Stack gap={4}>
                    <Text size="sm" fw={500}>Fecha de salida</Text>
                    <Stack align="center" gap="md" style={{ border: '1px solid var(--mantine-color-gray-4)', borderRadius: 8, padding: 12 }}>
                        <DatePicker
                            value={departureDateSearch}
                            onChange={setDepartureDateSearch as any}
                            defaultDate={departureDateSearch || new Date()}
                            withCellSpacing={false}
                        />
                    </Stack>
                </Stack>
            </Stack>
            <Button onClick={searchFlight} loading={searchLoading} fullWidth mt="md" disabled={!departureDateSearch}>
                Buscar
            </Button>
            {searchError && (
                <Alert color="red" mt="xs" p="xs" withCloseButton onClose={() => setSearchError(null)}>
                    {searchError}
                </Alert>
            )}
        </Card>
    );
};