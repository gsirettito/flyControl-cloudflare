'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Card,
    Group,
    Modal,
    Stack,
    Text,
    Title,
    Badge,
    Divider,
    ActionIcon,
    Flex,
    Loader,
    Alert,
} from '@mantine/core';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/es';
import { FaFilePdf, FaPlaneDeparture } from 'react-icons/fa';
import { filterConfigs } from '../list/filterConfigs';
import { BarFilter } from '@/components/DataTable/components/BarFilter';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('es');

type FlightEvent = {
    id: string;
    reservation: any;
    flight: any;
    flightDateStr: string; // 🔥 Usamos un string YYYY-MM-DD para agrupar por día local exacto
};

// Filtros que vamos a usar (excluimos createdAt:between)
const calendarFilterConfigs = filterConfigs.filter(cfg => cfg.id !== 'createdAt:between');

export const ReservationsCalendarIndex = () => {
    const [currentMonth, setCurrentMonth] = useState(dayjs());
    const [events, setEvents] = useState<FlightEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedReservation, setSelectedReservation] = useState<any | null>(null);
    const [modalOpened, setModalOpened] = useState(false);
    const [filters, setFilters] = useState<Record<string, any>>({});

    const setColumnFilter = useCallback((id: string, value: any) => {
        setFilters(prev => {
            if (value === undefined || value === null || value === '') {
                const { [id]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [id]: value };
        });
    }, []);

    const fetchReservations = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const startOfMonth = currentMonth.startOf('month').utc().startOf('day');
            const endOfMonth = currentMonth.endOf('month').utc().endOf('day');
            const startISO = startOfMonth.toISOString();
            const endISO = endOfMonth.toISOString();

            const params = new URLSearchParams();
            params.append('sortBy', 'createdAt');
            params.append('sortOrder', 'desc');
            params.append('createdAt:between', `${startISO},${endISO}`);

            Object.entries(filters).forEach(([key, value]) => {
                if (value && value !== '') {
                    params.append(key, value);
                }
            });

            const url = `/api/system/reservation?${params.toString()}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Error al cargar las reservas');
            const data = await response.json();

            const flightEvents: FlightEvent[] = [];
            for (const reservation of (data.data || [])) {
                const flights = reservation.departureFlights || [];
                for (const item of flights) {
                    const flight = item.flight;
                    if (!flight) continue;
                    
                    // 🔥 Convertimos el UTC a la zona horaria del origen para saber qué día es allá
                    const flightDateStr = dayjs.utc(flight.departureTime).tz(flight.originTimezone || 'UTC').format('YYYY-MM-DD');
                    
                    flightEvents.push({
                        id: `${reservation.id}_${flight.id}`,
                        reservation,
                        flight,
                        flightDateStr,
                    });
                }
            }
            setEvents(flightEvents);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Ocurrió un error');
        } finally {
            setLoading(false);
        }
    }, [currentMonth, filters]);

    useEffect(() => {
        fetchReservations();
    }, [fetchReservations]);

    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startDate = startOfMonth.startOf('week');
    const endDate = endOfMonth.endOf('week');
    const daysArray: dayjs.Dayjs[] = [];
    let day = startDate;
    while (day.isBefore(endDate) || day.isSame(endDate, 'day')) {
        daysArray.push(day);
        day = day.add(1, 'day');
    }

    const weeks: dayjs.Dayjs[][] = [];
    for (let i = 0; i < daysArray.length; i += 7) {
        weeks.push(daysArray.slice(i, i + 7));
    }

    const getEventsForDate = (date: dayjs.Dayjs) => {
        const dateStr = date.format('YYYY-MM-DD');
        return events.filter(event => event.flightDateStr === dateStr);
    };

    const handlePrevMonth = () => setCurrentMonth(currentMonth.subtract(1, 'month'));
    const handleNextMonth = () => setCurrentMonth(currentMonth.add(1, 'month'));

    const openReservationDetails = (reservation: any) => {
        setSelectedReservation(reservation);
        setModalOpened(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return <Badge color="green">Confirmada</Badge>;
            case 'PENDING': return <Badge color="yellow">Pendiente</Badge>;
            case 'REJECTED': return <Badge color="red">Rechazada</Badge>;
            default: return <Badge>Desconocido</Badge>;
        }
    };

    // 🔥 Formatea usando la zona horaria dinámica del aeropuerto
    const formatFlightDateTime = (dateStr: string, timezone?: string | null) => {
        return dayjs.utc(dateStr).tz(timezone || 'UTC').format('DD/MM/YYYY HH:mm');
    };

    const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    return (
        <Stack gap="xl">
            <Flex justify="space-between" align="center">
                <Title order={1}>Calendario de Reservas</Title>
                <Group>
                    <ActionIcon onClick={handlePrevMonth} variant="default">
                        <FiChevronLeft size={18} />
                    </ActionIcon>
                    <Text fw={500} size="lg" style={{ textTransform: 'capitalize' }}>{currentMonth.format('MMMM YYYY')}</Text>
                    <ActionIcon onClick={handleNextMonth} variant="default">
                        <FiChevronRight size={18} />
                    </ActionIcon>
                </Group>
            </Flex>

            <Group gap={4} flex={3}>
                <BarFilter
                    filterConfigs={calendarFilterConfigs}
                    filters={filters}
                    setColumnFilter={setColumnFilter}
                />
            </Group>

            <Card withBorder p="md">
                {loading && (
                    <Flex justify="center" align="center" py="xl">
                        <Loader />
                        <Text ml="md">Cargando reservas...</Text>
                    </Flex>
                )}
                {error && (
                    <Alert color="red" title="Error" mb="md">
                        {error}
                    </Alert>
                )}
                {!loading && !error && (
                    <>
                        <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
                            {weekDays.map(dayName => (
                                <Text key={dayName} ta="center" fw={600} size="sm">{dayName}</Text>
                            ))}
                        </Box>

                        {weeks.map((week, weekIdx) => (
                            <Box key={weekIdx} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginTop: 4 }}>
                                {week.map((date, dayIdx) => {
                                    const isCurrentMonth = date.month() === currentMonth.month();
                                    const dayEvents = getEventsForDate(date);
                                    return (
                                        <Box
                                            key={dayIdx}
                                            style={{
                                                minHeight: 100,
                                                backgroundColor: isCurrentMonth ? '#f8f9fa' : '#e9ecef',
                                                borderRadius: 8,
                                                padding: 4,
                                                border: '1px solid #dee2e6',
                                            }}
                                        >
                                            <Text size="xs" ta="right" c={isCurrentMonth ? 'dark' : 'gray'}>{date.format('D')}</Text>
                                            <Stack gap={4} mt={4}>
                                                {dayEvents.map(event => (
                                                    <Badge
                                                        key={event.id}
                                                        size="xs"
                                                        variant="light"
                                                        color={
                                                            event.reservation.status === 'REJECTED' ? 'red' :
                                                                event.reservation.status === 'CONFIRMED' ? 'green' : 'gray'
                                                        }
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => openReservationDetails(event.reservation)}
                                                        fullWidth
                                                    >
                                                        <Flex gap={6}>
                                                            <FaPlaneDeparture />
                                                            <Box>{event.reservation.reservationCode} / {event.flight.flightNumber}</Box>
                                                        </Flex>
                                                    </Badge>
                                                ))}
                                            </Stack>
                                        </Box>
                                    );
                                })}
                            </Box>
                        ))}
                    </>
                )}
            </Card>

            <Modal
                opened={modalOpened}
                onClose={() => setModalOpened(false)}
                title="Detalles de la Reserva"
                size="lg"
                centered
            >
                {selectedReservation && (
                    <Stack gap="md">
                        <Group justify="space-between">
                            <Text fw={700} size="lg">{selectedReservation.reservationCode}</Text>
                            <Group gap="xs">
                                {getStatusBadge(selectedReservation.status)}
                                {selectedReservation.pdfURL && (
                                    <ActionIcon
                                        component="a"
                                        href={selectedReservation.pdfURL}
                                        target="_blank"
                                        variant="filled"
                                        color="red"
                                        size="md"
                                    >
                                        <FaFilePdf size={18} />
                                    </ActionIcon>
                                )}
                            </Group>
                        </Group>
                        <Divider />
                        <Group>
                            <Stack gap={4} style={{ flex: 1 }}>
                                <Text fw={600}>Pasajero</Text>
                                <Text size="sm">{selectedReservation.passenger?.fullName}</Text>
                                <Text size="sm" c="dimmed">{selectedReservation.passenger?.email}</Text>
                                <Text size="sm" c="dimmed">Pasaporte: {selectedReservation.passenger?.passportNumber}</Text>
                            </Stack>
                            <Stack gap={4} style={{ flex: 1 }}>
                                <Text fw={600}>Reserva creada por</Text>
                                <Text size="sm">{selectedReservation.createdBy?.name}</Text>
                                <Text size="sm" c="dimmed">{selectedReservation.createdBy?.email}</Text>
                            </Stack>
                        </Group>
                        <Divider />
                        <Stack gap={4}>
                            <Text fw={600}>Itinerario</Text>
                            {selectedReservation.departureFlights?.map((item: any, idx: number) => {
                                const f = item.flight;
                                return (
                                    <Card key={idx} withBorder p="xs" radius="md">
                                        <Group justify="space-between">
                                            <Text fw={500}>{f.flightNumber}</Text>
                                            <Text>{f.origin} → {f.destination}</Text>
                                        </Group>
                                        {/* 🔥 Usamos la zona horaria dinámica del vuelo */}
                                        <Text size="xs" c="dimmed">
                                            Salida: {formatFlightDateTime(f.departureTime, f.originTimezone)}
                                        </Text>
                                        <Text size="xs" c="dimmed">{f.originName} → {f.destinationName}</Text>
                                    </Card>
                                );
                            })}
                        </Stack>
                        <Divider />
                        <Group justify="space-between">
                            <Stack gap={4}>
                                <Text fw={600}>Equipaje</Text>
                                <Text size="sm">{selectedReservation.baggage?.replace(/_/g, ' ')}</Text>
                            </Stack>
                            {selectedReservation.pnr && (
                                <Stack gap={4}>
                                    <Text fw={600}>PNR / Ticket</Text>
                                    <Text size="sm">{selectedReservation.pnr} / {selectedReservation.ticketNumber}</Text>
                                </Stack>
                            )}
                        </Group>
                        {selectedReservation.invoiceAmount && (
                            <>
                                <Divider />
                                <Group>
                                    <Text fw={600}>Factura</Text>
                                    <Text>{selectedReservation.invoiceAmount} {selectedReservation.invoiceCurrency}</Text>
                                </Group>
                            </>
                        )}
                        <Divider />
                        <Text size="xs" c="dimmed">Creado: {dayjs(selectedReservation.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
                        <Text size="xs" c="dimmed">Actualizado: {dayjs(selectedReservation.updatedAt).format('DD/MM/YYYY HH:mm')}</Text>
                    </Stack>
                )}
            </Modal>
        </Stack>
    );
};