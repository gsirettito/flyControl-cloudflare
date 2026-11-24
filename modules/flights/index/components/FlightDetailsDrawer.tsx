'use client';

import { Drawer, Stack, Group, Text, Badge, Divider, Grid, Box, Flex } from '@mantine/core';
import { FlightType } from '@/types/ModelsType';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { IoAirplaneSharp } from 'react-icons/io5';

interface FlightDetailsDrawerProps {
    opened: boolean;
    onClose: () => void;
    flight: FlightType | null;
}

export function FlightDetailsDrawer({ opened, onClose, flight }: FlightDetailsDrawerProps) {
    if (!flight) return null;

    const depTz = flight.originTimezone || 'UTC';
    const arrTz = flight.destinationTimezone || 'UTC';
    const creationDate = flight.createdAt ? new Date(flight.createdAt).toLocaleDateString() : '—';
    const seats = flight.availableSeats ?? 0; // Evita undefined
    const airlineName = flight.airline?.displayName || 'Aerolínea no especificada';

    return (
        <Drawer opened={opened} onClose={onClose} title="Detalles del Vuelo" position="right" size="md" padding="md">
            <Stack gap="lg">
                <Box>
                    <Group justify="space-between">
                        <Text size="xl" fw={700}>{flight.flightNumber}</Text>
                        <Badge color="blue" variant="light">{airlineName}</Badge>
                    </Group>
                    <Text size="sm" c="dimmed" mt="xs">
                        Creado el {creationDate}
                    </Text>
                </Box>

                <Divider />

                <Box>
                    <Text fw={600} mb="md" size="sm" c="dimmed" tt="uppercase">Ruta</Text>
                    <Flex justify="space-between" align="center" p="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: 8 }}>
                        <Stack gap={0}>
                            <Text size="xl" fw={700}>{flight.origin}</Text>
                            <Text size="xs" c="dimmed" w={120}>{flight.originName}</Text>
                        </Stack>
                        <Stack align="center" gap={4}>
                            <IoAirplaneSharp size={24} color="var(--mantine-color-blue-5)" />
                            <Text size="xs" c="dimmed">{flight.class === 'ECONOMY' ? 'Económica' : flight.class === 'BUSINESS' ? 'Business' : 'Primera'}</Text>
                        </Stack>
                        <Stack gap={0} style={{ textAlign: 'right' }}>
                            <Text size="xl" fw={700}>{flight.destination}</Text>
                            <Text size="xs" c="dimmed" w={120} ta="right">{flight.destinationName}</Text>
                        </Stack>
                    </Flex>
                </Box>

                <Box>
                    <Text fw={600} mb="xs" size="sm" c="dimmed" tt="uppercase">Horarios (Hora Local)</Text>
                    <Grid>
                        <Grid.Col span={6}>
                            <Text size="xs" c="dimmed">Salida</Text>
                            <Text size="sm" fw={500}>
                                {formatInTimeZone(new Date(flight.departureTime), depTz, 'dd MMM yyyy, HH:mm', { locale: es })}
                            </Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Text size="xs" c="dimmed">Llegada</Text>
                            <Text size="sm" fw={500}>
                                {formatInTimeZone(new Date(flight.arrivalTime), arrTz, 'dd MMM yyyy, HH:mm', { locale: es })}
                            </Text>
                        </Grid.Col>
                    </Grid>
                </Box>

                <Divider />

                <Box>
                    <Text fw={600} mb="xs" size="sm" c="dimmed" tt="uppercase">Disponibilidad</Text>
                    <Group>
                        <Text size="sm">Asientos disponibles:</Text>
                        <Badge color={seats > 0 ? "teal" : "red"}>
                            {seats} asientos
                        </Badge>
                    </Group>
                </Box>
            </Stack>
        </Drawer>
    );
}