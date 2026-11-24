import { primary } from "@/components/ui/Theme/color"
import { Badge, Box, Card, Drawer, Group, Loader, Radio, Stack, Title, Tooltip, Text } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { ReactNode, useId, useState } from "react"
import { FormDrawNewFly } from "./FormDrawNewFly";
import { useForm } from "react-hook-form";
import { FlightType } from "@/types/ModelsType";

export const LabelNumberFly = ({
    children,
    departureDate,
    returnDate
}: {
    children: ReactNode;
    departureDate: string;
    returnDate: string | undefined;
}) => {
    const [opened, { open, close }] = useDisclosure(false);
    const flightNumber = `${children}`.replaceAll(",", "")
    const uniqueId = useId() // genera un ID único para evitar conflictos
    const className = `hover-box-${uniqueId}`

    const {
        control,
        watch,
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        getValues,
        reset
    } = useForm<FlightType>();

    const [loading, setLoading] = useState(false)
    const [airlines, setAirlines] = useState<{ value: string; label: string }[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedFlightIndex, setSelectedFlightIndex] = useState<number | null>(null);

    // Función para asegurar que una aerolínea existe en el desplegable
    const ensureAirlineExists = async (airlineIdentifier: string): Promise<string | null> => {
        // Primero intentamos encontrar por IATA o nombre en el estado actual
        const existing = airlines.find(a =>
            a.label.toLowerCase().includes(airlineIdentifier.toLowerCase()) ||
            a.label.includes(`(${airlineIdentifier.toUpperCase()})`)
        );
        if (existing) return existing.value;

        // Si no existe, la buscamos en el backend
        try {
            const params = new URLSearchParams({
                page: "1",
                limit: "1",
                sortBy: "createdAt",
                sortOrder: "desc",
                "iata:like": airlineIdentifier,
            });
            const response = await fetch(`/api/system/airlines?${params.toString()}`);
            if (response.ok) {
                const result = await response.json();
                const item = result.data?.[0];
                if (item) {
                    const newAirline = {
                        value: item.id,
                        label: `${item.displayName} (${item.iata})`,
                    };
                    setAirlines(prev => [...prev, newAirline]);
                    return newAirline.value;
                }
            }
        } catch (error) {
            console.error("Error al buscar aerolínea:", error);
        }
        return null;
    };

    const searchFlight = async () => {
        setLoading(true)
        try {
            /* let formattedDate: string;
            if (typeof departureDateSearch === 'string') {
                formattedDate = departureDateSearch;
            } else if (departureDateSearch instanceof Date) {
                formattedDate = departureDateSearch.toISOString().split('T')[0];
            } else {
                throw new Error('Formato de fecha inválido');
            } */

            const response = await fetch(
                `/api/system/flight-api?flight_number=${flightNumber.toUpperCase()}&date_from=${departureDate}&date_to=${returnDate}`
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error en la búsqueda");
            }

            const result = await response.json();
            const flights = result.flights;

            if (!flights || flights.length === 0) {
                /* setSearchError("No se encontraron vuelos para ese día"); */
                return;
            }

            console.log("flights", flights)

            setSearchResults(flights);
            open()
        } catch (error: any) {
            console.error(error);
            /* setSearchError(error.message || "No se pudo encontrar el vuelo"); */
        } finally {
            setLoading(false)
        }
    };

    // Función para seleccionar un vuelo y llenar el formulario
    const selectFlight = (flight: any, index: number) => {
        if (flight.status.includes("Landed")) {
            notifications.show({
                title: "No se puede completar",
                message: "Este vuelo ya ha aterrizado",
                color: 'blue'
            })
            return
        }

        setSelectedFlightIndex(index);
        setValue('flightNumber', flight.flightNumber);
        setValue('origin', flight.origin);
        setValue('destination', flight.destination);
        setValue('originName', flight.originName);
        setValue('destinationName', flight.destinationName);
        if (flight.departureUtc) setValue('departureTime', flight.departureUtc);
        if (flight.arrivalUtc) setValue('arrivalTime', flight.arrivalUtc);
        if (flight.airlineIata) {
            ensureAirlineExists(flight.airlineIata).then(airlineId => {
                if (airlineId) setValue('airlineId', airlineId);
            });
        }
    };

    const flightStatusFilter = (status: string) => {
        if (status.includes("Landed")) {
            return `Aterrizado ${status.split("Landed")[1]}`
        }
        else if (status == 'Scheduled') {
            return `Programado`
        }
        else if (status.includes("Estimated")) {
            return `Tiempo estimado`
        }

        return status
    }

    const getDateInLocalTimezone = (dateUtc: string, timezone: string) => {

        // Crear objeto Date (se interpreta como UTC)
        const date = new Date(dateUtc);

        // Opciones de formato
        const options = {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        } as any;

        // Obtener la fecha y hora en la zona horaria especificada
        return date.toLocaleString('en-US', options);
    }

    return (
        <>
            <style>
                {`
                    .${className} {
                        transition: all 0.2s ease;
                        cursor: pointer;
                        text-decoration: underline
                    }
                    .${className}:hover {
                        color: ${primary[5]};
                        transform: scale(1.02);
                    }
                `}
            </style>

            {opened && <Drawer opened={opened} onClose={() => {
                reset();
                close();
                setSelectedFlightIndex(null)
            }} title={"Agregar vuelo"}>
                <Stack gap="md">
                    {/* Resultados de búsqueda - Lista seleccionable */}
                    {searchResults.length > 0 && (
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
                                                <Text size="sm">
                                                    {flight.origin} → {flight.destination}
                                                </Text>
                                                <Text size="xs" c="dimmed">
                                                    {flight.eta ? (new Date(flight.eta)).toLocaleString() : ''}
                                                </Text>
                                            </Group>
                                        </Group>
                                        <Group mt="xs" gap="sm">
                                            <Tooltip label={`Zona Horaria: ${flight.originTimezone}`}>
                                                <Text size="xs">
                                                    🛫 {flight.departureUtc ? getDateInLocalTimezone(flight.departureUtc, flight.originTimezone) : '--:--'}
                                                </Text>
                                            </Tooltip>
                                            <Tooltip label={`Zona Horaria: ${flight.destinationTimezone}`}>
                                                <Text size="xs">
                                                    🛬 {flight.arrivalUtc ? getDateInLocalTimezone(flight.arrivalUtc, flight.destinationTimezone) : '--:--'}
                                                </Text>
                                            </Tooltip>
                                            {flight.originName && flight.destinationName && (
                                                <Text size="xs" c="dimmed">
                                                    {flight.originName} → {flight.destinationName}
                                                </Text>
                                            )}
                                        </Group>
                                    </Card>
                                ))}
                            </Stack>
                        </Stack>
                    )}

                    <FormDrawNewFly
                        control={control}
                        errors={errors}
                        handleSubmit={handleSubmit}
                        register={register}
                        getValues={getValues}
                        onClose={() => {
                            reset();
                            close();
                            setSelectedFlightIndex(null)
                        }}
                    />
                </Stack>
            </Drawer>}

            {loading ? (
                <Loader color="primary" size={'xs'} />
            ) : (
                <Box className={className} onClick={searchFlight}>
                    {flightNumber}
                </Box >
            )}
        </>
    )
}