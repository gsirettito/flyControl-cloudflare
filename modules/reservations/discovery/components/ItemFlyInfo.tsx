'use client';

import { Fragment } from 'react';
import {
    Flex, Stack,
    Card, Badge, Text, Group, Accordion, Divider, Image, ThemeIcon, Box
} from '@mantine/core';
import {
    FiArrowRight,
    FiClock,
    FiInfo,
    FiMaximize2,
    FiPlayCircle,
    FiCloud
} from 'react-icons/fi';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { LabelNumberFly } from './LabelNumberFly';

dayjs.extend(utc);

export const ItemFlyInfo = ({ flight, tripType }: { flight: any, tripType: 'round' | 'oneway' }) => {
    const firstLeg = flight.legs[0];
    const lastLeg = flight.legs[flight.legs.length - 1];
    const totalDurationMinutes = flight.total_duration_minutes;
    const totalHours = Math.floor(totalDurationMinutes / 60);
    const totalMinutes = totalDurationMinutes % 60;

    // Emisiones totales
    const totalCO2 = flight.legs.reduce((acc: number, leg: any) => acc + (leg.co2_emissions_g || 0), 0);
    const co2kg = (totalCO2 / 1000).toFixed(0);

    // Formateo de Fecha
    const departureDate = dayjs(firstLeg.departure_datetime);
    const formattedDate = departureDate.format('ddd, D MMM');

    // Renderizado de una pierna (Leg)
    const renderLeg = (leg: any, index: number, isLast: boolean) => {
        const originTime = dayjs(leg.departure_datetime).format('HH:mm');
        const arrivalTime = dayjs(leg.arrival_datetime).format('HH:mm');
        const durationH = Math.floor(leg.duration_minutes / 60);
        const durationM = leg.duration_minutes % 60;

        return (
            <Flex key={index} gap="md" style={{ width: '100%' }}>
                {/* Columna Izquierda: Timeline */}
                <Stack align="center" style={{ width: '20px', minHeight: '100%' }} gap={0}>
                    <Box w={12} h={12} bg="gray.4" style={{ borderRadius: '50%', flexShrink: 0, border: '3px solid', borderColor: 'var(--mantine-color-gray-1)' }} />
                    <Box w="2px" flex={1} bg="gray.3" />
                </Stack>

                {/* Columna Central: Detalles del Vuelo */}
                <Stack style={{ flex: 1 }} gap={4}>
                    <Group justify="space-between" wrap="nowrap">
                        <Stack gap={0}>
                            <Text fw={700} size="lg" style={{ lineHeight: 1.2 }}>{originTime}</Text>
                            <Text size="xs" c="dimmed">{leg.origin}</Text>
                            <Text size="xs" c="dimmed">{leg.origin_name}</Text>
                        </Stack>

                        <Stack align="center" gap={0} style={{ minWidth: 100 }}>
                            <Text size="xs" c="dimmed" ta="center">Duración: {durationH}h {durationM}m</Text>
                            <Flex align="center" gap={4}>
                                <Divider size="xs" style={{ width: 30 }} />
                                <FiArrowRight size={14} color="gray" />
                                <Divider size="xs" style={{ width: 30 }} />
                            </Flex>
                        </Stack>

                        <Stack align="end" gap={0}>
                            <Text fw={700} size="lg" style={{ lineHeight: 1.2 }}>{arrivalTime}</Text>
                            <Text size="xs" c="dimmed">{leg.destination}</Text>
                            <Text size="xs" c="dimmed">{leg.destination_name}</Text>
                        </Stack>
                    </Group>

                    <Group gap="xs" mt={2}>
                        <Badge variant="light" color="gray" size="xs">{leg.airline} ({leg.airlineIata})</Badge>
                        <Text size="xs" c="dimmed" span style={{ display: 'flex', gap: '4px' }}>{leg.aircraft} •
                            <LabelNumberFly
                                departureDate={dayjs(leg.departure_datetime).format('YYYY-MM-DD')}
                                returnDate={dayjs(leg.arrival_datetime).format('YYYY-MM-DD')}
                            >
                                {leg.airlineIata}{leg.flight_number}
                            </LabelNumberFly>
                        </Text>
                    </Group>
                </Stack>

                {/* Columna Derecha: Amenities y Emisiones (CON ICONOS) */}
                <Stack style={{ minWidth: 180, maxWidth: 220 }} gap={6} justify="flex-start" pt={4}>
                    {/* 1. Espacio para las piernas (basado en leg.legroom) */}
                    <Group gap={6} align="center" wrap="nowrap">
                        <FiMaximize2 size={14} color="gray" />
                        <Text size="xs" c="dimmed">
                            {leg.legroom && parseInt(leg.legroom) < 30
                                ? `Poco espacio para las piernas (${leg.legroom})`
                                : `Espacio para las piernas: ${leg.legroom || 'Estándar'}`}
                        </Text>
                    </Group>

                    {/* 2. Entretenimiento a bordo */}
                    {leg.amenities?.on_demand_video ? (
                        <Group gap={6} align="center" wrap="nowrap">
                            <FiPlayCircle size={14} color="gray" />
                            <Text size="xs" c="dimmed">Reproduce contenido multimedia en tu dispositivo</Text>
                        </Group>
                    ) : leg.amenities?.in_seat_video ? (
                        <Group gap={6} align="center" wrap="nowrap">
                            <FiPlayCircle size={14} color="gray" />
                            <Text size="xs" c="dimmed">Entretenimiento en pantalla en el asiento</Text>
                        </Group>
                    ) : leg.amenities?.wifi ? (
                        <Group gap={6} align="center" wrap="nowrap">
                            <FiPlayCircle size={14} color="gray" />
                            <Text size="xs" c="dimmed">Wi-Fi disponible en el vuelo</Text>
                        </Group>
                    ) : null}

                    {/* 3. Energía (Power) si está disponible */}
                    {leg.amenities?.power && (
                        <Group gap={6} align="center" wrap="nowrap">
                            <FiInfo size={14} color="gray" />
                            <Text size="xs" c="dimmed">Enchufe en el asiento</Text>
                        </Group>
                    )}

                    {/* 4. USB Power si está disponible */}
                    {leg.amenities?.usb_power && (
                        <Group gap={6} align="center" wrap="nowrap">
                            <FiInfo size={14} color="gray" />
                            <Text size="xs" c="dimmed">Puerto USB en el asiento</Text>
                        </Group>
                    )}

                    {/* 5. Emisiones de CO₂ (dinámico) */}
                    <Group gap={6} align="center" wrap="nowrap">
                        <FiCloud size={14} color="gray" />
                        <Text size="xs" c="dimmed">
                            Emisiones estimadas: {((leg.co2_emissions_g || 0) / 1000).toFixed(0)} kg de CO₂e
                        </Text>
                    </Group>
                </Stack>
            </Flex>
        );
    };

    // Cálculo de escala si hay 2 tramos
    let stopoverText = null;
    let stopoverDurationHours = 0;
    let stopoverDurationMinutes = 0;
    let stopoverAirport = '';
    if (flight.legs.length === 2) {
        const arrFirst = dayjs(flight.legs[0].arrival_datetime);
        const depSecond = dayjs(flight.legs[1].departure_datetime);
        const diffMinutes = depSecond.diff(arrFirst, 'minute');
        if (diffMinutes > 0) {
            const hours = Math.floor(diffMinutes / 60);
            const minutes = diffMinutes % 60;
            stopoverDurationHours = hours;
            stopoverDurationMinutes = minutes;
            stopoverAirport = flight.legs[0].destination;
            stopoverText = `Escala de ${hours}h ${minutes}m · ${stopoverAirport} (${stopoverAirport})`;
        }
    }

    return (
        <Card withBorder radius="0" p={0}>
            <Accordion variant="filled" chevronPosition="right">
                <Accordion.Item value="details">
                    <Accordion.Control>
                        <Group justify="space-between" wrap="nowrap" w="100%" pr="md">
                            {/* Parte Izquierda: Logo y Fecha */}
                            <Group gap="xs" style={{ minWidth: 180 }}>
                                <Image
                                    w={32}
                                    src={`https://www.gstatic.com/flights/airline_logos/70px/${firstLeg.airlineIata}.png`}
                                    fallbackSrc="https://placehold.co/32x32?text=✈"
                                    alt={firstLeg.airline}
                                />
                                <Stack gap={0}>
                                    <Text fw={500} size="sm">{flight.legs[0].airline} • {formattedDate}</Text>
                                </Stack>
                            </Group>

                            {/* Parte Central: Emisiones */}
                            <Group gap="xs" style={{ minWidth: 120, justifyContent: 'center' }}>
                                {/* <Text size="sm" fw={500}>{co2kg} kg CO₂e</Text> */}
                                {/* <Badge size="xs" color="gray" variant="light">+{Math.floor(Math.random() * 400 + 100)}% emisiones</Badge> */}
                            </Group>

                            {/* Botón de Selección */}
                            {/* <Button size="xs" variant="outline" radius="xl" color="primary" style={{ display: 'inline-flex' }}>
                                Seleccionar vuelo
                            </Button> */}

                            {/* Parte Derecha: Precio */}
                            <Stack align="flex-end" gap={0} style={{ minWidth: 80 }}>
                                <Text fw={700} size="lg" c="secondary.7">
                                    {flight.price ? `${flight.price} ${flight.currency}` : '-'}
                                </Text>
                                <Text size="xs" c="dimmed" style={{ marginTop: -2 }}>{tripType == 'oneway' ? "Solo Ida" : "Ida y vuelta"}</Text>
                            </Stack>
                        </Group>
                    </Accordion.Control>

                    <Accordion.Panel pt="sm" px="lg">
                        <Stack gap="md">
                            {/* Iteramos sobre los tramos del vuelo insertando la escala entre ellos */}
                            {flight.legs.map((leg: any, idx: number) => {
                                const isLast = idx === flight.legs.length - 1;
                                return (
                                    <Fragment key={idx}>
                                        {renderLeg(leg, idx, isLast)}

                                        {/* Renderizar la escala si es el primer tramo y hay 2 tramos */}
                                        {idx === 0 && flight.legs.length === 2 && stopoverText && (
                                            <Flex gap="md" style={{ width: '100%' }}>
                                                {/* Columna Izquierda: Timeline con línea completa */}
                                                <Stack align="center" style={{ width: '20px', minHeight: '100%' }} gap={0}>
                                                    <Box w="2px" flex={1} bg="gray.3" />
                                                    <Box w={12} h={12} bg="gray.4" style={{ borderRadius: '50%', flexShrink: 0, border: '3px solid', borderColor: 'var(--mantine-color-gray-1)' }} />
                                                    <Box w="2px" flex={1} bg="gray.3" />
                                                </Stack>

                                                {/* Contenido de la escala */}
                                                <Box bg="gray.1" py="xs" px="md" style={{ width: '100%', borderRadius: 4 }}>
                                                    <Group gap="xs">
                                                        <ThemeIcon size="sm" variant="light" color="gray">
                                                            <FiClock size={12} />
                                                        </ThemeIcon>
                                                        <Text size="sm" fw={500}>{stopoverText}</Text>
                                                    </Group>
                                                </Box>
                                            </Flex>
                                        )}
                                    </Fragment>
                                );
                            })}
                        </Stack>
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>
        </Card>
    );
};