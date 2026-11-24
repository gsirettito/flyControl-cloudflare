// modules/invoices/form.tsx
'use client';

import { useFieldArray, useFormContext, Controller } from 'react-hook-form';
import { Button, Group, Stack, TextInput, NumberInput, ActionIcon, Paper, Text, Select } from '@mantine/core';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

export type InvoiceFormValues = {
    clientId: string | null;
    currency: string;
    items: {
        description: string;
        quantity: number;
        amount: number;
        reservationId: string | null;
    }[];
};

interface FormInvoiceProps {
    clients: { value: string; label: string }[];
    reservations: { value: string; label: string }[];
}

export const FormInvoice = ({ clients, reservations }: FormInvoiceProps) => {
    // 🔥 Usamos el contexto en lugar de recibir props
    const { control, register, formState: { errors }, watch } = useFormContext<InvoiceFormValues>();

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'items',
    });

    const items = watch('items') || [];
    const total = items.reduce((acc: number, item: any) => acc + ((item.amount || 0) * (item.quantity || 1)), 0);

    return (
        <Stack gap="md">
            <Group grow>
                <Controller
                    name="clientId"
                    control={control}
                    render={({ field }) => (
                        <Select
                            label="Cliente (Opcional)"
                            data={clients}
                            clearable
                            searchable
                            value={field.value}
                            onChange={field.onChange}
                        />
                    )}
                />
                <Controller
                    name="currency"
                    control={control}
                    render={({ field }) => (
                        <Select
                            label="Moneda"
                            data={['USD', 'EUR', 'CUP', 'MXN']}
                            value={field.value}
                            onChange={field.onChange}
                        />
                    )}
                />
            </Group>

            <Text fw={600} mt="md">Servicios / Conceptos</Text>

            {fields.map((field, index) => (
                <Paper key={field.id} withBorder p="sm" radius="md">
                    <Group align="flex-start" wrap="nowrap">
                        <Stack gap={2} style={{ flex: 1 }}>
                            <TextInput
                                label={index === 0 ? "Descripción" : undefined}
                                placeholder="Ej: Vuelo HA123 o Hotel 3 noches"
                                {...register(`items.${index}.description`, { required: 'Requerido' })}
                                error={errors?.items?.[index]?.description?.message as string}
                            />

                            <Controller
                                name={`items.${index}.reservationId`}
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        placeholder="Vincular Reserva (Opcional)"
                                        data={reservations}
                                        clearable
                                        searchable
                                        size="xs"
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                        </Stack>

                        {/* 🔥 Usamos Controller para los NumberInput para evitar conflictos de tipos */}
                        <Controller
                            name={`items.${index}.quantity`}
                            control={control}
                            render={({ field }) => (
                                <NumberInput
                                    label={index === 0 ? "Cant." : undefined}
                                    placeholder="1"
                                    min={1}
                                    w={70}
                                    value={field.value}
                                    onChange={(val) => field.onChange(typeof val === 'number' ? val : parseInt(val) || 1)}
                                />
                            )}
                        />

                        <Controller
                            name={`items.${index}.amount`}
                            control={control}
                            render={({ field }) => (
                                <NumberInput
                                    label={index === 0 ? "Monto" : undefined}
                                    placeholder="0.00"
                                    min={0}
                                    w={100}
                                    decimalScale={2}
                                    value={field.value}
                                    onChange={(val) => field.onChange(typeof val === 'number' ? val : parseFloat(val) || 0)}
                                />
                            )}
                        />

                        <ActionIcon
                            color="red"
                            mt={index === 0 ? 28 : 0}
                            onClick={() => remove(index)}
                            disabled={fields.length === 1}
                        >
                            <FiTrash2 size={16} />
                        </ActionIcon>
                    </Group>
                </Paper>
            ))}

            <Group justify="space-between" mt="sm">
                <Button
                    variant="light"
                    leftSection={<FiPlus size={14} />}
                    size="xs"
                    onClick={() => append({ description: '', quantity: 1, amount: 0, reservationId: null })}
                >
                    Agregar otro servicio
                </Button>
                <Text fw={700} size="lg">Total: ${total.toFixed(2)}</Text>
            </Group>
        </Stack>
    );
};