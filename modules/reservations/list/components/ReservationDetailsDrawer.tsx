'use client';

import { Drawer, Stack, Group, Text, Badge, Divider, Button, Grid, Box, Flex } from '@mantine/core';
import { ReservationType, FlightType, ClientType } from '@/types/ModelsType';
import dayjs from 'dayjs';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { IoAirplaneSharp } from 'react-icons/io5';
import { useRouter } from 'next/navigation';
import { FiFileText } from 'react-icons/fi';

interface ReservationDetailsDrawerProps {
    opened: boolean;
    onClose: () => void;
    reservation: ReservationType | null;
    onViewFlight: (flight: FlightType) => void;     // <-- Nueva prop
    onViewClient: (client: ClientType) => void;     // <-- Nueva prop
}

export function ReservationDetailsDrawer({ opened, onClose, reservation, onViewFlight, onViewClient }: ReservationDetailsDrawerProps) {
    if (!reservation) return null;

    const router = useRouter();

    const getStatusBadge = (status: string) => {
        if (status === 'PENDING') return <Badge color="gray">PRERESERVA</Badge>;
        if (status === 'REJECTED') return <Badge color="red">CANCELADA</Badge>;
        if (status === 'CONFIRMED') return <Badge color="green">CONFIRMADO</Badge>;
        return null;
    };

    const renderFlights = (flights: any[]) => {
        if (!flights || flights.length === 0) return <Text size="sm" c="dimmed">No hay vuelos registrados</Text>;

        return flights.map((f, index) => {
            const flight = f.flight as FlightType;
            const depTz = flight.originTimezone || 'UTC';
            const arrTz = flight.destinationTimezone || 'UTC';

            return (
                <Box
                    key={index}
                    p="md"
                    mb="sm"
                    style={{
                        backgroundColor: 'var(--mantine-color-gray-0)',
                        borderRadius: 8,
                        cursor: 'pointer',
                        border: '1px solid transparent',
                        transition: 'border 0.2s'
                    }}
                    onClick={() => onViewFlight(flight)}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--mantine-color-gray-4)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                >
                    <Flex justify="space-between" align="center" mb="xs">
                        <Text fw={700} size="md">{flight.flightNumber}</Text>
                        <Text size="xs" c="dimmed">
                            {formatInTimeZone(new Date(flight.departureTime), depTz, 'dd MMM yyyy', { locale: es })}
                        </Text>
                    </Flex>

                    <Flex justify="space-between" align="center">
                        <Stack gap={0}>
                            <Text size="lg" fw={700}>{flight.origin}</Text>
                            <Text size="xs" c="dimmed" w={100} lineClamp={2}>{flight.originName}</Text>
                        </Stack>
                        <Stack align="center" gap={4}>
                            <IoAirplaneSharp size={18} color="var(--mantine-color-blue-5)" />
                        </Stack>
                        <Stack gap={0} style={{ textAlign: 'right' }}>
                            <Text size="lg" fw={700}>{flight.destination}</Text>
                            <Text size="xs" c="dimmed" w={100} ta="right" lineClamp={2}>{flight.destinationName}</Text>
                        </Stack>
                    </Flex>

                    <Flex justify="space-between" align="center" mt="xs">
                        <Text size="xs" c="dimmed">
                            {formatInTimeZone(new Date(flight.departureTime), depTz, 'HH:mm', { locale: es })}
                        </Text>
                        <Text size="xs" c="dimmed">
                            {formatInTimeZone(new Date(flight.arrivalTime), arrTz, 'HH:mm', { locale: es })}
                        </Text>
                    </Flex>
                </Box>
            );
        });
    };

    return (
        <Drawer opened={opened} onClose={onClose} title="Detalles de la Reserva" position="right" size="md" padding="md">
            <Stack gap="lg">
                {/* Cabecera */}
                <Box>
                    <Group justify="space-between">
                        <Text size="xl" fw={700}>{reservation.reservationCode}</Text>
                        {getStatusBadge(reservation.status)}
                    </Group>
                    <Text size="sm" c="dimmed" mt="xs">
                        Creada el {dayjs(reservation.createdAt).format('DD/MM/YYYY HH:mm')} por {reservation.createdBy?.name || '—'}
                    </Text>
                </Box>

                <Divider />

                {/* Pasajero (Clickeable) */}
                <Box>
                    <Text fw={600} mb="xs" size="sm" c="dimmed" tt="uppercase">Pasajero</Text>
                    <Grid>
                        <Grid.Col span={12}>
                            <Text
                                size="md"
                                fw={700}
                                style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--mantine-color-primary-filled)' }}
                                onClick={() => onViewClient(reservation.passenger as ClientType)}
                            >
                                {reservation.passenger?.fullName}
                            </Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Text size="xs" c="dimmed">Email</Text>
                            <Text size="sm">{reservation.passenger?.email || '—'}</Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Text size="xs" c="dimmed">Pasaporte</Text>
                            <Text size="sm">{reservation.passenger?.passportNumber || '—'}</Text>
                        </Grid.Col>
                    </Grid>
                </Box>

                <Divider />

                {/* Vuelos (Clickeables) */}
                <Box>
                    <Text fw={600} mb="sm" size="sm" c="dimmed" tt="uppercase">
                        Itinerario {reservation.tripType === 'ONE_WAY' ? '(Solo Ida)' : '(Ida y Vuelta)'}
                    </Text>

                    <Text size="xs" fw={500} mb="xs">Vuelos de Ida</Text>
                    {renderFlights(reservation.departureFlights || [])}

                    {reservation.tripType === 'ROUND_TRIP' && (
                        <>
                            <Text size="xs" fw={500} mb="xs" mt="md">Vuelos de Vuelta</Text>
                            {renderFlights(reservation.returnFlights || [])}
                        </>
                    )}
                </Box>

                <Divider />

                {/* Ticket y Pago */}
                <Box>
                    <Text fw={600} mb="xs" size="sm" c="dimmed" tt="uppercase">Información del Ticket</Text>
                    <Grid>
                        <Grid.Col span={6}>
                            <Text size="xs" c="dimmed">PNR</Text>
                            <Text size="sm">{reservation.pnr || 'No asignado'}</Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Text size="xs" c="dimmed">Número de Ticket</Text>
                            <Text size="sm">{reservation.ticketNumber || 'No asignado'}</Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Text size="xs" c="dimmed">Precio</Text>
                            <Text size="sm">
                                {reservation.invoiceAmount ? `${reservation.invoiceAmount} ${reservation.invoiceCurrency}` : '—'}
                            </Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Text size="xs" c="dimmed">Equipaje</Text>
                            <Text size="sm">{reservation.baggage || '—'}</Text>
                        </Grid.Col>
                    </Grid>
                    <Button
                        variant="light"
                        mt="md"
                        fullWidth
                        leftSection={<FiFileText />}
                        onClick={() => {
                            // Redirigimos al formulario de facturas pasando los datos de la reserva por query params
                            router.push(`/invoices?create=true&clientId=${reservation.passengerId}&reservationId=${reservation.id}&description=Vuelo ${reservation.reservationCode}&amount=${reservation.invoiceAmount || 0}`);
                        }}
                    >
                        Generar Factura de esta Reserva
                    </Button>
                </Box>
            </Stack>
        </Drawer>
    );
}