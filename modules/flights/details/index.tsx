'use client';

import { FlightType } from '@/types/ModelsType';
import { Card, Container, Group, Text, NumberInput, Select, Stack, TextInput, Title } from '@mantine/core';
import { formatInTimeZone } from 'date-fns-tz';
import { Controller, useForm } from 'react-hook-form';

export const FlightsDetailsIndex = ({
    flight
}: {
    flight: FlightType
}) => {

    const {
        control,
        register,
        formState: { errors },
        getValues
    } = useForm<FlightType>({
        defaultValues: {
            ...flight
        }
    });

    const classOptions = [
        { value: 'ECONOMY', label: 'Económica' },
        { value: 'BUSINESS', label: 'Business' },
        { value: 'FIRST', label: 'Primera Clase' },
    ];

    return (
        <Stack justify='center' h="85vh">
            <Container size={'md'} w={'100%'}>
                <Card withBorder radius="md" p="md">
                    <Title order={4} mb="md">Datos del Vuelo</Title>

                    <TextInput
                        label="Aerolínea"
                        value={getValues('airline')?.displayName}
                        readOnly
                    />

                    {/* Número de vuelo */}
                    <TextInput
                        label="Número de vuelo"
                        placeholder="Ej: CM123"
                        error={errors.flightNumber?.message}
                        {...register('flightNumber', {
                            required: 'El número de vuelo es obligatorio',
                            pattern: { value: /^[A-Z0-9]{2,6}$/, message: 'Formato inválido (letras y números, 2-6 caracteres)' }
                        })}
                        readOnly
                    />

                    {/* 🔥 Fecha/Hora Salida (Texto Plano con Zona Horaria) */}
                    <TextInput
                        label="Fecha y hora de salida"
                        value={
                            flight.departureTime
                                ? formatInTimeZone(
                                    new Date(flight.departureTime),
                                    flight.originTimezone || 'UTC',
                                    'dd/MM/yyyy HH:mm'
                                  )
                                : ''
                        }
                        readOnly
                    />

                    {/* 🔥 Fecha/Hora Llegada (Texto Plano con Zona Horaria) */}
                    <TextInput
                        label="Fecha y hora de llegada"
                        value={
                            flight.arrivalTime
                                ? formatInTimeZone(
                                    new Date(flight.arrivalTime),
                                    flight.destinationTimezone || 'UTC',
                                    'dd/MM/yyyy HH:mm'
                                  )
                                : ''
                        }
                        readOnly
                    />

                    {/* Origen y Destino en un grupo */}
                    <Group grow>
                        <Stack gap={0}>
                            <TextInput
                                label="Origen (código IATA)"
                                placeholder="Ej: PTY"
                                error={errors.origin?.message}
                                {...register('origin', {
                                    required: 'El origen es obligatorio',
                                    minLength: 3,
                                    maxLength: 3,
                                    pattern: /^[A-Za-z]{3}$/
                                })}
                                readOnly
                            />
                            {getValues('originName') && (
                                <Text size="xs" c="dimmed" mt={2}>
                                    {getValues('originName')}
                                </Text>
                            )}
                        </Stack>
                        <Stack gap={0}>
                            <TextInput
                                label="Destino (código IATA)"
                                placeholder="Ej: MAD"
                                error={errors.destination?.message}
                                {...register('destination', {
                                    required: 'El destino es obligatorio',
                                    minLength: 3,
                                    maxLength: 3,
                                    pattern: /^[A-Za-z]{3}$/
                                })}
                                readOnly
                            />
                            {getValues('destinationName') && (
                                <Text size="xs" c="dimmed" mt={2}>
                                    {getValues('destinationName')}
                                </Text>
                            )}
                        </Stack>
                    </Group>

                    {/* Clase y Asientos disponibles en grupo */}
                    <Group grow>
                        <Controller
                            name="class"
                            control={control}
                            rules={{ required: 'Debe seleccionar una clase' }}
                            render={({ field }) => (
                                <Select
                                    label="Clase"
                                    placeholder="Seleccione clase"
                                    data={classOptions}
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={errors.class?.message}
                                    required
                                    readOnly
                                />
                            )}
                        />
                        <Controller
                            name="availableSeats"
                            control={control}
                            rules={{
                                required: 'Los asientos disponibles son obligatorios',
                                min: { value: 0, message: 'No puede ser negativo' }
                            }}
                            render={({ field }) => (
                                <NumberInput
                                    label="Asientos disponibles"
                                    placeholder="Cantidad"
                                    min={0}
                                    value={field.value}
                                    onChange={(val) => field.onChange(val || 0)}
                                    error={errors.availableSeats?.message}
                                    required
                                    readOnly
                                />
                            )}
                        />
                    </Group>
                </Card>
            </Container>
        </Stack>
    );
};