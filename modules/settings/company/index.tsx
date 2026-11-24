'use client';

import { CompanyType } from '@/types/ModelsType';
import { Button, Card, ColorInput, SimpleGrid, Stack, TextInput, Title } from '@mantine/core';
import { Slider, Text, Box } from '@mantine/core';
import { useForm, Controller } from 'react-hook-form';
import { FlightTicketPreview } from '../index/components/FlightTicketPreview'; // Ajusta la ruta si es necesario
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { ImageUploadWithCrop } from '@/components/ImageUploadWithCrop';

const colorSwatches = [
    '#25262b', '#868e96', '#fa5252', '#e64980', '#be4bdb',
    '#7950f2', '#4c6ef5', '#228be6', '#15aabf', '#12b886',
    '#40c057', '#82c91e', '#fab005', '#fd7e14',
];

export const CompanySettings = ({ company }: { company: CompanyType }) => {
    const [loading, setLoading] = useState(false);

    const { control, watch, register, handleSubmit, formState: { errors }, setValue, reset } = useForm<CompanyType>({
        defaultValues: { ...company }
    });

    const handleSubmitForm = async (data: CompanyType) => {
        setLoading(true);
        const { address, commercialName, logoUrl, phone, preReservationExpiryHours, primaryColor, secondaryColor, textColor, ticketPrefix } = data;

        const payload = {
            address, commercialName, logoUrl, phone,
            preReservationExpiryHours: parseInt(`${preReservationExpiryHours}`),
            primaryColor, secondaryColor, textColor, ticketPrefix,
        };

        const res = await fetch("/api/system/companies", {
            method: "PUT",
            body: JSON.stringify({ id: data.id, data: payload })
        });

        if (res.ok) {
            reset(data);
            notifications.show({ title: 'Éxito', message: 'Datos de la empresa actualizados', color: 'green' });
        } else {
            const result = await res.json();
            notifications.show({ title: 'Error', message: result.error || 'Error al actualizar', color: 'red' });
        }
        setLoading(false);
    }

    return (
        <Stack>
            <Title order={1}>Datos de Empresa</Title>
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                <Card withBorder radius="md" p="md">
                    <form onSubmit={handleSubmit(handleSubmitForm)}>
                        <Stack align="center" mb="md">
                            <ImageUploadWithCrop
                                outputFormat="png"
                                onChangeImage={(url) => { setValue('logoUrl', url as string) }}
                                image={watch('logoUrl') || undefined}
                                uploadEndpoint="/api/upload-image"
                                cropWidth={300} cropHeight={300}
                                previewWidth={150} previewHeight={150}
                                label="Logo de la Empresa"
                            />
                        </Stack>

                        <Stack gap="sm">
                            <TextInput label="Nombre Comercial" error={errors.commercialName?.message} {...register('commercialName', { required: 'Obligatorio' })} disabled={loading} />
                            <Controller name="primaryColor" control={control} rules={{ required: 'Obligatorio' }} render={({ field }) => (
                                <ColorInput
                                    {...field}
                                    value={field.value || ''} // 🔒 FIX: Si es null, pasamos un string vacío
                                    label="Color Primario"
                                    format="hex"
                                    swatches={colorSwatches}
                                    error={errors.primaryColor?.message}
                                    disabled={loading}
                                />
                            )} />
                            <Controller name="secondaryColor" control={control} rules={{ required: 'Obligatorio' }} render={({ field }) => (
                                <ColorInput
                                    {...field}
                                    value={field.value || ''} // 🔒 FIX: Si es null, pasamos un string vacío
                                    disabled={loading}
                                    label="Color Secundario"
                                    format="hex"
                                    swatches={colorSwatches}
                                    error={errors.secondaryColor?.message}
                                />
                            )} />
                            <Controller name="textColor" control={control} rules={{ required: 'Obligatorio' }} render={({ field }) => (
                                <ColorInput
                                    {...field}
                                    value={field.value || ''} // 🔒 FIX: Si es null, pasamos un string vacío
                                    label="Color Del Texto"
                                    format="hex"
                                    swatches={colorSwatches}
                                    error={errors.textColor?.message}
                                    disabled={loading}
                                />
                            )} />
                            <TextInput label="Teléfono" error={errors.phone?.message} {...register('phone', { required: 'Obligatorio' })} disabled={loading} />
                            <TextInput label="Dirección" error={errors.address?.message} {...register('address', { required: 'Obligatorio' })} disabled={loading} />
                            <TextInput label="Prefijo de Ticket" error={errors.ticketPrefix?.message} {...register('ticketPrefix', { required: 'Obligatorio' })} disabled={loading} />
                            <Controller
                                name="preReservationExpiryHours"
                                control={control}
                                rules={{ required: 'Obligatorio' }}
                                render={({ field }) => (
                                    <Box>
                                        <Text size="sm" fw={500} mb={4}>Horas de Expiración de Pre-Reserva (24h - 7 días)</Text>
                                        <Slider
                                            min={24}
                                            max={168}
                                            step={6} // Puede ser de 6 en 6 horas
                                            marks={[
                                                { value: 24, label: '24h' },
                                                { value: 48, label: '48h' },
                                                { value: 72, label: '72h' },
                                                { value: 96, label: '96h' },
                                                { value: 168, label: '7d' },
                                            ]}
                                            value={field.value || 24}
                                            onChange={field.onChange}
                                            mb="xl"
                                        />
                                    </Box>
                                )}
                            />
                        </Stack>

                        <Button type="submit" loading={loading} fullWidth mt="md">
                            Guardar Cambios
                        </Button>
                    </form>
                </Card>

                <Stack gap="0">
                    <Title order={4} mb="md">Vista Previa del Documento</Title>
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