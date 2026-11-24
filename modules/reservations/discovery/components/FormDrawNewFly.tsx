import { FlightType } from "@/types/ModelsType";
import { Button, Card, Group, NumberInput, Select, Stack, TextInput, Title, Text } from "@mantine/core"
import { DateTimePicker } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { Control, Controller, FieldErrors, UseFormGetValues, UseFormHandleSubmit, UseFormRegister } from "react-hook-form";

export const FormDrawNewFly = ({
    control,
    errors,
    handleSubmit,
    register,
    getValues,
    onClose
}: {
    control: Control<FlightType, any, FlightType>;
    errors: FieldErrors<FlightType>;
    handleSubmit: UseFormHandleSubmit<FlightType, FlightType>;
    register: UseFormRegister<FlightType>
    getValues: UseFormGetValues<FlightType>
    onClose: () => void
}) => {
    const [loading, setLoading] = useState(false)

    // Opciones para el selector de clase
    const classOptions = [
        { value: 'ECONOMY', label: 'Económica' },
        { value: 'BUSINESS', label: 'Business' },
        { value: 'FIRST', label: 'Primera Clase' },
    ];

    const handleSetData = async (data: FlightType) => {
        setLoading(true)
        const url = new URL("/api/system/flights", window.location.origin);
        try {
            let res = await fetch(url.toString(), {
                method: "POST",
                body: JSON.stringify({ data })
            })
            const result = await res.json();
            if (!res.ok) {
                throw new Error(result.error || 'Error al crear el registro');
            }
            notifications.show({
                title: 'Éxito',
                message: `Vuelo creado correctamente`,
                color: 'green',
            });
            onClose();
        } catch (error: any) {
            console.error(error);
            notifications.show({
                title: 'Error',
                message: error.message || 'Ocurrió un error inesperado',
                color: 'red',
            });
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit(handleSetData)}>
            <Card withBorder radius="md" p="md">
                <Title order={4} mb="md">Datos del Vuelo</Title>

                {/* Aerolínea con búsqueda remota */}
                <TextInput
                    label="Aerolínea"
                    placeholder="Ej: CM..."
                    error={errors.airlineId?.message}
                    {...register('airlineId', {
                        required: 'La aerolinea es obligatorio'
                    })}
                    disabled
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
                    disabled
                />

                {/* Fecha/Hora Salida */}
                <Controller
                    name="departureTime"
                    control={control}
                    rules={{ required: 'La fecha de salida es obligatoria' }}
                    render={({ field }) => (
                        <DateTimePicker
                            label="Fecha y hora de salida"
                            placeholder="Seleccione fecha y hora"
                            value={field.value ? new Date(field.value) : null}
                            onChange={(date) => field.onChange(date ? (new Date(date)).toISOString() : null)}
                            error={errors.departureTime?.message}
                            clearable
                            required
                            disabled
                        />
                    )}
                />

                {/* Fecha/Hora Llegada */}
                <Controller
                    name="arrivalTime"
                    control={control}
                    rules={{ required: 'La fecha de llegada es obligatoria' }}
                    render={({ field }) => (
                        <DateTimePicker
                            label="Fecha y hora de llegada"
                            placeholder="Seleccione fecha y hora"
                            value={field.value ? new Date(field.value) : null}
                            onChange={(date) => field.onChange(date ? (new Date(date)).toISOString() : null)}
                            error={errors.arrivalTime?.message}
                            clearable
                            required
                            disabled
                        />
                    )}
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
                            disabled
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
                            disabled
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
                            />
                        )}
                    />
                </Group>
            </Card>

            <Button type="submit" mt="md" loading={loading}>Registrar Vuelo</Button>
        </form>
    )
}