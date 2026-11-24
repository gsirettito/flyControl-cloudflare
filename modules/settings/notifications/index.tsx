'use client';

import { CompanyType } from '@/types/ModelsType';
import { Button, Card, Stack, Title, Switch, Text, Box } from '@mantine/core';
import { useForm } from 'react-hook-form';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

export const NotificationsSettings = ({ company }: { company: CompanyType }) => {
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, reset } = useForm<CompanyType>({
        defaultValues: { ...company }
    });

    const handleSubmitForm = async (data: CompanyType) => {
        setLoading(true);
        const { notifySmsConfirm, notifyEmailConfirm, notifyManagerEmail, notifyFlightReminders } = data;

        const payload = { notifySmsConfirm, notifyEmailConfirm, notifyManagerEmail, notifyFlightReminders };

        const res = await fetch("/api/system/companies", {
            method: "PUT",
            body: JSON.stringify({ id: data.id, data: payload })
        });

        if (res.ok) {
            reset(data);
            notifications.show({ title: 'Éxito', message: 'Preferencias de notificación guardadas', color: 'green' });
        } else {
            const result = await res.json();
            notifications.show({ title: 'Error', message: result.error || 'Error al actualizar', color: 'red' });
        }
        setLoading(false);
    }

    return (
        <Stack>
            <Title order={1}>Notificaciones Automáticas</Title>

            {/* 👇 Usamos maw (max-width) en lugar de w fija, y cambiamos el padding a md */}
            <Card withBorder radius="md" p="md" maw={800}>
                <form onSubmit={handleSubmit(handleSubmitForm)}>
                    <Text size="sm" c="dimmed" mb="lg">
                        Configura cómo el sistema se comunica con tus clientes y gestores durante el ciclo de vida de la reserva.
                    </Text>

                    <Stack gap="lg">
                        <Switch
                            label="Notificar confirmación por Email al cliente"
                            description="Envía un correo con el boleto en PDF cuando la reserva cambia a CONFIRMADA."
                            {...register('notifyEmailConfirm')}
                            disabled={loading}
                        />
                        <Switch
                            label="Notificar confirmación por SMS al cliente"
                            description="Envía un mensaje de texto con el PNR y Ticket cuando la reserva es confirmada."
                            {...register('notifySmsConfirm')}
                            disabled={loading}
                        />
                        <Switch
                            label="Notificar al gestor por Email"
                            description="Envía una alerta interna al correo del gestor que creó la reserva cuando esta se confirma."
                            {...register('notifyManagerEmail')}
                            disabled={loading}
                        />
                        <Switch
                            label="Enviar recordatorios de vuelo (24h y 4h antes)"
                            description="El sistema enviará un SMS/Email automático al pasajero con los detalles de su vuelo antes de la salida."
                            {...register('notifyFlightReminders')}
                            disabled={loading}
                        />
                    </Stack>

                    {/* 👇 Botón idéntico al de Datos de Empresa */}
                    <Button type="submit" loading={loading} fullWidth mt="md">
                        Guardar Preferencias
                    </Button>
                </form>
            </Card>
        </Stack>
    );
};