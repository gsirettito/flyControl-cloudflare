'use client';

import { useState } from 'react';
import { ClientDate } from '@/components/ClientDate';
import { ReservationType, FlightType, ClientType } from '@/types/ModelsType';
import { Stack, Title, Flex, Grid, Card, Text, Group, Badge, Button, Table, ThemeIcon, SimpleGrid, Paper } from '@mantine/core';
import Link from 'next/link';
import { FiTag, FiUsers, FiCheck, FiX, FiClock, FiArrowRight } from 'react-icons/fi';
import { IoAirplaneOutline, IoAirplaneSharp } from 'react-icons/io5';

// Importamos los Drawers
import { ReservationDetailsDrawer } from '@/modules/reservations/list/components/ReservationDetailsDrawer';
import { FlightDetailsDrawer } from '@/modules/flights/index/components/FlightDetailsDrawer';
import { ClientDetailsDrawer } from '@/modules/clients/index/components/ClientDetailsDrawer';

// 🔥 Componente auxiliar para las tarjetas de métricas (Aplica la regla 60-30-10)
const StatCard = ({ title, value, description, icon, color }: any) => (
    <Paper shadow="sm" radius="lg" p="xl" withBorder={false} style={{ border: '1px solid #f1f3f5' }}>
        <Stack gap="xs">
            <Group justify="space-between" align="flex-start">
                <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.5px' }}>
                    {title}
                </Text>
                <ThemeIcon color={color} variant="light" size="lg" radius="md">
                    {icon}
                </ThemeIcon>
            </Group>
            <Text fw={800} fz={32} lh={1} mt="sm" style={{ fontFamily: 'var(--font-outfit), sans-serif' }}>
                {value}
            </Text>
            <Text size="xs" c="dimmed" fw={500}>
                {description}
            </Text>
        </Stack>
    </Paper>
);

export const HomeIndex = ({
    userName,
    stats,
    recentReservations,
    upcomingFlightsList
}: {
    userName: string;
    stats: {
        pendingReservations: number;
        confirmedReservations: number;
        rejectedReservations: number;
        totalClients: number;
        upcomingFlights: number;
        activeAirlines: number;
    },
    recentReservations: ReservationType[],
    upcomingFlightsList: FlightType[]
}) => {

    // --- ESTADOS PARA LOS DRAWERS ---
    const [selectedReservation, setSelectedReservation] = useState<ReservationType | null>(null);
    const [reservationDrawerOpened, setReservationDrawerOpened] = useState(false);

    const [selectedFlight, setSelectedFlight] = useState<FlightType | null>(null);
    const [flightDrawerOpened, setFlightDrawerOpened] = useState(false);

    const [selectedClient, setSelectedClient] = useState<ClientType | null>(null);
    const [clientDrawerOpened, setClientDrawerOpened] = useState(false);

    // Handlers
    const handleViewReservation = (res: ReservationType) => {
        setSelectedReservation(res);
        setReservationDrawerOpened(true);
    };

    const handleViewFlight = (flight: FlightType) => {
        setSelectedFlight(flight);
        setFlightDrawerOpened(true);
    };

    const handleViewClient = (client: ClientType) => {
        setSelectedClient(client);
        setClientDrawerOpened(true);
    };

    return (
        <>
            <Stack gap="xl">
                {/* HEADER DE BIENVENIDA */}
                <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align="center">
                    <Title order={1} style={{ fontFamily: 'var(--font-outfit), sans-serif', fontSize: '32px' }}>
                        ¡Bienvenid@ {userName}!
                    </Title>
                    <Group mt={{ base: 'md', md: 0 }}>
                        <Link href={"/reservations"}>
                            <Button variant="filled" color="primary" radius="md" leftSection={<FiTag size={16} />}>
                                Nueva reserva
                            </Button>
                        </Link>
                        <Link href={"/reservations/list"}>
                            <Button variant="subtle" color="gray" radius="md">
                                Ver todas
                            </Button>
                        </Link>
                    </Group>
                </Flex>

                {/* TARJETAS DE MÉTRICAS (Refactorizadas para usar el componente StatCard) */}
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
                    <StatCard
                        title="Reservas Pendientes"
                        value={stats.pendingReservations}
                        description="Requieren confirmación"
                        icon={<FiClock size={20} />}
                        color="orange"
                    />
                    <StatCard
                        title="Reservas Confirmadas"
                        value={stats.confirmedReservations}
                        description="Viajes confirmados"
                        icon={<FiCheck size={20} />}
                        color="green"
                    />
                    <StatCard
                        title="Reservas Canceladas"
                        value={stats.rejectedReservations}
                        description="Rechazadas o anuladas"
                        icon={<FiX size={20} />}
                        color="red"
                    />
                    <StatCard
                        title="Clientes Registrados"
                        value={stats.totalClients}
                        description="Pasajeros en el sistema"
                        icon={<FiUsers size={20} />}
                        color="blue"
                    />
                    <StatCard
                        title="Vuelos Próximos (7d)"
                        value={stats.upcomingFlights}
                        description="Salidas en los próximos 7 días"
                        icon={<IoAirplaneOutline size={20} />}
                        color="teal"
                    />
                    <StatCard
                        title="Aerolíneas Activas"
                        value={stats.activeAirlines}
                        description="Operando actualmente"
                        icon={<IoAirplaneSharp size={20} />}
                        color="grape"
                    />
                </SimpleGrid>

                {/* SECCIÓN INFERIOR: TABLA Y VUELOS */}
                <Grid gap="lg">
                    {/* TABLA DE ÚLTIMAS RESERVAS */}
                    <Grid.Col span={{ base: 12, md: 7 }}>
                        <Paper shadow="sm" radius="lg" p="xl" withBorder={false} style={{ border: '1px solid #f1f3f5', height: '100%' }}>
                            <Group justify="space-between" mb="lg">
                                <Title order={3} size="h4" style={{ fontFamily: 'var(--font-outfit), sans-serif' }}>
                                    Últimas reservas
                                </Title>
                                <Link href={"/reservations/list"}>
                                    <Button size='xs' variant="subtle" color="gray" rightSection={<FiArrowRight size={14} />}>
                                        Ver todas
                                    </Button>
                                </Link>
                            </Group>

                            <Table verticalSpacing="sm" highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr style={{ backgroundColor: 'transparent' }}>
                                        <Table.Th style={{ color: 'var(--mantine-color-gray-6)' }}>Código</Table.Th>
                                        <Table.Th style={{ color: 'var(--mantine-color-gray-6)' }}>Pasajero</Table.Th>
                                        <Table.Th style={{ color: 'var(--mantine-color-gray-6)' }}>Estado</Table.Th>
                                        <Table.Th style={{ color: 'var(--mantine-color-gray-6)' }}>Fecha</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {recentReservations.map((res, i) => (
                                        <Table.Tr key={`recentReservations${i}`}>
                                            <Table.Td>
                                                <Text
                                                    style={{
                                                        cursor: 'pointer',
                                                        color: 'var(--mantine-color-dark-9)',
                                                        fontWeight: 600,
                                                        transition: 'color 0.2s'
                                                    }}
                                                    onClick={() => handleViewReservation(res)}
                                                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--mantine-color-primary-filled)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--mantine-color-dark-9)'}
                                                >
                                                    {res.reservationCode}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text
                                                    style={{
                                                        cursor: 'pointer',
                                                        color: 'var(--mantine-color-dark-9)',
                                                        fontWeight: 500,
                                                        transition: 'color 0.2s'
                                                    }}
                                                    onClick={() => res.passenger && handleViewClient(res.passenger as ClientType)}
                                                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--mantine-color-primary-filled)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--mantine-color-dark-9)'}
                                                >
                                                    {res.passenger?.fullName ?? '—'}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Badge
                                                    color={res.status === 'PENDING' ? 'orange' : res.status === 'CONFIRMED' ? 'green' : 'red'}
                                                    variant="light"
                                                    radius="sm"
                                                >
                                                    {res.status === 'PENDING' ? 'Pendiente' : res.status === 'CONFIRMED' ? 'Confirmada' : 'Cancelada'}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm" c="dimmed">
                                                    <ClientDate date={new Date(res.createdAt)} />
                                                </Text>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Paper>
                    </Grid.Col>

                    {/* LISTA DE PRÓXIMOS VUELOS */}
                    <Grid.Col span={{ base: 12, md: 5 }}>
                        <Paper shadow="sm" radius="lg" p="xl" withBorder={false} style={{ border: '1px solid #f1f3f5', height: '100%' }}>
                            <Group justify="space-between" mb="lg">
                                <Title order={3} size="h4" style={{ fontFamily: 'var(--font-outfit), sans-serif' }}>
                                    Próximos vuelos (48h)
                                </Title>
                                <Link href={"/flight"}>
                                    <Button size='xs' variant="subtle" color="gray" rightSection={<FiArrowRight size={14} />}>
                                        Ver todas
                                    </Button>
                                </Link>
                            </Group>
                            <Stack gap="xs">
                                {upcomingFlightsList.map((flight, i) => (
                                    <Card
                                        key={`flight${i}`}
                                        withBorder={false}
                                        p="md"
                                        radius="md"
                                        style={{
                                            cursor: 'pointer',
                                            backgroundColor: 'var(--mantine-color-gray-0)',
                                            transition: 'all 0.2s ease',
                                        }}
                                        onClick={() => handleViewFlight(flight)}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-1)';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        <Group justify="space-between" wrap="nowrap">
                                            <Group gap="sm" wrap="nowrap">
                                                <ThemeIcon size="md" variant="light" color="blue" radius="xl">
                                                    <IoAirplaneOutline size={16} />
                                                </ThemeIcon>
                                                <Stack gap={0}>
                                                    <Text fw={700} size="sm" style={{ fontFamily: 'var(--font-outfit)' }}>{flight.flightNumber}</Text>
                                                    <Text size="xs" c="dimmed" fw={500}>{flight.origin} → {flight.destination}</Text>
                                                </Stack>
                                            </Group>
                                            <Stack gap={0} align="flex-end">
                                                <Text size="xs" fw={600} c="dark.7">
                                                    <ClientDate date={new Date(flight.departureTime)} />
                                                </Text>
                                            </Stack>
                                        </Group>
                                    </Card>
                                ))}
                            </Stack>
                        </Paper>
                    </Grid.Col>
                </Grid>
            </Stack>

            {/* --- RENDERIZADO DE LOS DRAWERS --- */}
            <ReservationDetailsDrawer
                opened={reservationDrawerOpened}
                onClose={() => setReservationDrawerOpened(false)}
                reservation={selectedReservation}
                onViewFlight={handleViewFlight}
                onViewClient={handleViewClient}
            />

            {selectedFlight && (
                <FlightDetailsDrawer
                    opened={flightDrawerOpened}
                    onClose={() => setFlightDrawerOpened(false)}
                    flight={selectedFlight}
                />
            )}

            {selectedClient && (
                <ClientDetailsDrawer
                    opened={clientDrawerOpened}
                    onClose={() => setClientDrawerOpened(false)}
                    client={selectedClient}
                />
            )}
        </>
    );
};