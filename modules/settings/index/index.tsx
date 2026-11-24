'use client';

import { CompanyType } from '@/types/ModelsType';
import { Button, Card, ColorInput, Flex, SimpleGrid, Stack, TextInput, Title, Switch, Divider, Text } from '@mantine/core';
import { useForm, Controller } from 'react-hook-form';
import { FlightTicketPreview } from './components/FlightTicketPreview';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { ImageUploadWithCrop } from '@/components/ImageUploadWithCrop';

const colorSwatches = [
    '#25262b', '#868e96', '#fa5252', '#e64980', '#be4bdb',
    '#7950f2', '#4c6ef5', '#228be6', '#15aabf', '#12b886',
    '#40c057', '#82c91e', '#fab005', '#fd7e14',
];

export const SettingsIndex = ({
    company
}: {
    company: CompanyType
}) => {
    const [loading, setLoading] = useState(false);

    const {
        control,
        watch,
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        reset
    } = useForm<CompanyType>({
        defaultValues: { ...company }
    });

    const handleSubmitForm = async (data: CompanyType) => {
        setLoading(true);
        const {
            address, commercialName, logoUrl, phone, preReservationExpiryHours,
            primaryColor, secondaryColor, textColor, ticketPrefix,
            notifySmsConfirm, notifyEmailConfirm, notifyManagerEmail, notifyFlightReminders
        } = data;
        
        let payload = {
            address, commercialName, logoUrl, phone,
            preReservationExpiryHours: parseInt(`${preReservationExpiryHours}`),
            primaryColor, secondaryColor, textColor, ticketPrefix,
            // 👇 Añadimos los booleanos al payload
            notifySmsConfirm, notifyEmailConfirm, notifyManagerEmail, notifyFlightReminders
        };

        const url = new URL("/api/system/companies", window.location.origin);
        const res = await fetch(url.toString(), {
            method: "PUT",
            body: JSON.stringify({
                id: data.id,
                data: { ...payload }
            })
        });

        if (res.ok) {
            reset(data)
            notifications.show({
                title: 'Éxito',
                message: 'Configuración actualizada correctamente',
                color: 'green',
            });
        }
        else {
            const result = await res.json();
            notifications.show({
                title: 'Error',
                message: result.error || 'Error al actualizar la configuración',
                color: 'red',
            });
        }
        setLoading(false);
    }

    return (
        <Stack>
            <Title flex={1} order={1}>Configuración</Title>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 2 }} spacing="xl">
                <form onSubmit={handleSubmit(handleSubmitForm)}>
                    <Stack gap="xl">
                        {/* TARJETA 1: DATOS DE EMPRESA */}
                        <Card withBorder radius="md" p="md">
                            <Title order={4} mb="md">Datos de Empresa</Title>

                            <Stack align="center" mb="md">
                                <ImageUploadWithCrop
                                    outputFormat="png"
                                    onChangeImage={(url) => { setValue('logoUrl', url as string) }}
                                    image={watch('logoUrl') || undefined}
                                    uploadEndpoint="/api/upload-image"
                                    cropWidth={300}
                                    cropHeight={300}
                                    previewWidth={150}
                                    previewHeight={150}
                                    label="Logo de la Empresa"
                                />
                            </Stack>

                            <Stack gap="sm">
                                <TextInput label="Nombre Comercial" error={errors.commercialName?.message} {...register('commercialName', { required: 'Obligatorio' })} disabled={loading} />
                                
                                <Controller name="primaryColor" control={control} rules={{ required: 'Obligatorio' }} render={({ field }: { field: any }) => (
                                    <ColorInput label="Color Primario" format="hex" swatches={colorSwatches} error={errors.primaryColor?.message} {...field} disabled={loading} />
                                )} />
                                
                                <Controller name="secondaryColor" control={control} rules={{ required: 'Obligatorio' }} render={({ field }: { field: any }) => (
                                    <ColorInput label="Color Secundario" format="hex" swatches={colorSwatches} error={errors.secondaryColor?.message} {...field} disabled={loading} />
                                )} />

                                <Controller name="textColor" control={control} rules={{ required: 'Obligatorio' }} render={({ field }: { field: any }) => (
                                    <ColorInput label="Color Del Texto" format="hex" swatches={colorSwatches} error={errors.textColor?.message} {...field} disabled={loading} />
                                )} />

                                <TextInput label="Teléfono" error={errors.phone?.message} {...register('phone', { required: 'Obligatorio' })} disabled={loading} />
                                <TextInput label="Dirección" error={errors.address?.message} {...register('address', { required: 'Obligatorio' })} disabled={loading} />
                                <TextInput label="Prefijo de Ticket" error={errors.ticketPrefix?.message} {...register('ticketPrefix', { required: 'Obligatorio' })} disabled={loading} />
                                <TextInput label="Horas de Expiración de Reserva" type="number" error={errors.preReservationExpiryHours?.message} {...register('preReservationExpiryHours', { required: 'Obligatorio' })} disabled={loading} />
                            </Stack>
                        </Card>

                        {/* TARJETA 2: NOTIFICACIONES */}
                        <Card withBorder radius="md" p="md">
                            <Title order={4} mb="xs">Notificaciones Automáticas</Title>
                            <Text size="xs" c="dimmed" mb="md">Configura cómo y cuándo el sistema notifica a los clientes y gestores.</Text>
                            
                            <Stack gap="lg">
                                <Switch 
                                    label="Notificar confirmación por Email al cliente" 
                                    description="Envía un correo con el boleto PDF cuando la reserva es confirmada."
                                    {...register('notifyEmailConfirm')}
                                    disabled={loading}
                                />
                                <Divider />
                                <Switch 
                                    label="Notificar confirmación por SMS al cliente" 
                                    description="Envía un mensaje de texto con el PNR y Ticket cuando la reserva es confirmada."
                                    {...register('notifySmsConfirm')}
                                    disabled={loading}
                                />
                                <Divider />
                                <Switch 
                                    label="Notificar al gestor por Email" 
                                    description="Envía una copia de la confirmación al correo del gestor que creó la reserva."
                                    {...register('notifyManagerEmail')}
                                    disabled={loading}
                                />
                                <Divider />
                                <Switch 
                                    label="Enviar recordatorios de vuelo (24h y 4h antes)" 
                                    description="El sistema enviará un SMS/Email automático al pasajero antes de su vuelo."
                                    {...register('notifyFlightReminders')}
                                    disabled={loading}
                                />
                            </Stack>
                        </Card>

                        <Button type="submit" loading={loading} fullWidth size="md">
                            Guardar Toda la Configuración
                        </Button>
                    </Stack>
                </form>

                {/* VISTA PREVIA */}
                <Stack gap="0">
                    <Title order={4} mb="md">Vista Previa</Title>
                    <FlightTicketPreview
                        companyName={watch('commercialName')}
                        documentTitle="Documento principal empresa"
                        defaultMessage="Este estilo será el predeterminado para PDFs y Correos electrónicos."
                        passenger={{ name: "Rolando Julian Gomez" }}
                        primaryColor={watch('primaryColor') as string}
                        secondaryColor={watch('secondaryColor') as string}
                        textColor={watch('textColor') as string}
                    />
                </Stack>
            </SimpleGrid>
        </Stack>
    );
};