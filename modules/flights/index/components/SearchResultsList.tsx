import { Stack, Title, Card, Group, Radio, Badge, Text, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { flightStatusFilter, getDateInLocalTimezone } from './utils';

interface SearchResultsListProps {
    searchResults: any[];
    selectedFlightIndex: number | null;
    onSelect: (flight: any, index: number) => void
    /*   
    selectFlight: (flight: any, index: number) => void;  
    flightStatusFilter: (status: string) => string;
    getDateInLocalTimezone: (dateUtc: string, timezone: string) => string; */
}

export const SearchResultsList = ({
    searchResults,
    selectedFlightIndex,
    onSelect
    /*   selectFlight, flightStatusFilter, getDateInLocalTimezone */
}: SearchResultsListProps) => {
    if (searchResults.length === 0) return null;

    const selectFlight = (flight: any, index: number) => {
        if (flight.status.includes("Landed")) {
            notifications.show({ title: "No se puede completar", message: "Este vuelo ya ha aterrizado", color: 'blue' });
            return;
        }
        onSelect(flight, index)
        /* onSelectIndex(index);
        setValue('flightNumber', flight.flightNumber);
        setValue('origin', flight.origin); setValue('destination', flight.destination);
        setValue('originName', flight.originName); setValue('destinationName', flight.destinationName);
        if (flight.departureUtc) setValue('departureTime', flight.departureUtc);
        if (flight.arrivalUtc) setValue('arrivalTime', flight.arrivalUtc);
        setValue('originTimezone', flight.originTimezone || null);
        setValue('destinationTimezone', flight.destinationTimezone || null);
        if (flight.airlineIata) {
            ensureAirlineExists(flight.airlineIata).then(airlineId => { if (airlineId) setValue('airlineId', airlineId); });
        } */
    };

    return (
        <Stack gap="sm">
            <Title order={5}>Seleccione el vuelo deseado</Title>
            <Stack gap="sm">
                {searchResults.map((flight, idx) => (
                    <Card
                        key={`flight-search-${idx}`}
                        radius="md"
                        p="sm"
                        style={{
                            cursor: 'pointer',
                            backgroundColor: selectedFlightIndex === idx ? 'var(--mantine-color-primary-light)' : undefined,
                            transition: 'all 0.2s',
                        }}
                        onClick={() => selectFlight(flight, idx)}
                    >
                        <Group justify="space-between" wrap="nowrap">
                            <Group gap="md" wrap="wrap">
                                <Radio
                                    checked={selectedFlightIndex === idx}
                                    onChange={() => selectFlight(flight, idx)}
                                    label={`${flight.flightNumber} - ${flight.airlineName || flight.airlineIata}`}
                                />
                                <Badge color="primary" variant="filled">
                                    {flightStatusFilter(flight.status)}
                                </Badge>
                            </Group>
                            <Group gap="lg">
                                <Text size="sm">{flight.origin} → {flight.destination}</Text>
                            </Group>
                        </Group>
                        <Group mt="xs" gap="sm">
                            <Tooltip label={`Zona Horaria: ${flight.originTimezone}`}>
                                <Text size="xs">🛫 {flight.departureUtc ? getDateInLocalTimezone(flight.departureUtc, flight.originTimezone) : '--:--'}</Text>
                            </Tooltip>
                            <Tooltip label={`Zona Horaria: ${flight.destinationTimezone}`}>
                                <Text size="xs">🛬 {flight.arrivalUtc ? getDateInLocalTimezone(flight.arrivalUtc, flight.destinationTimezone) : '--:--'}</Text>
                            </Tooltip>
                        </Group>
                    </Card>
                ))}
            </Stack>
        </Stack>
    );
};