import { AirlineType } from "@/types/ModelsType";
import {
    Button,
    Stack,
    TextInput,
    Switch,
    Image,
    Group,
    Text,
    Paper,
    Flex,
    Box,
} from "@mantine/core";
import { Control, Controller, FieldErrors, UseFormGetValues, UseFormRegister, UseFormSetValue, useWatch } from 'react-hook-form';
import { useEffect, useState } from 'react';

type Props = {
    label: string;
    errors: FieldErrors<AirlineType>;
    control: Control<any, any, any>;
    register: UseFormRegister<AirlineType>;
    setValue: UseFormSetValue<AirlineType>;
    getValues: UseFormGetValues<AirlineType>
};

export const FormAirline = ({
    label,
    errors,
    control,
    register,
    setValue,
    getValues
}: Props) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Observa el valor actual del campo iata en tiempo real
    const iataValue = useWatch({ control, name: 'iata' });

    // Genera la URL del logo a partir del código IATA (2 caracteres)
    const generateLogoUrl = (iata: string): string => {
        if (!iata || iata.length !== 2) return '';
        return `https://pics.avs.io/200/80/${iata.toUpperCase()}.png`;
    };

    // Actualiza la vista previa y el campo logoUrl cuando cambia el IATA
    useEffect(() => {
        if (iataValue && iataValue.length === 2) {
            const url = generateLogoUrl(iataValue);
            setPreviewUrl(url);
            setValue('logoUrl', url, { shouldValidate: false });
        } else {
            setPreviewUrl(null);
            setValue('logoUrl', '', { shouldValidate: false });
        }
    }, [iataValue, setValue]);

    // Función manual para forzar la actualización (por si el usuario quiere recargar)
    const updateLogo = () => {
        if (iataValue && iataValue.length === 2) {
            const url = generateLogoUrl(iataValue);
            setPreviewUrl(url);
            setValue('logoUrl', url, { shouldValidate: false });
        }
    };

    return (
        <Stack gap="md">
            <TextInput
                label="Código IATA"
                placeholder="Ej: CM (2 caracteres)"
                error={errors.iata?.message}
                {...register('iata', {
                    required: 'El código IATA es obligatorio',
                    minLength: { value: 2, message: 'Debe tener exactamente 2 caracteres' },
                    maxLength: { value: 2, message: 'Debe tener exactamente 2 caracteres' },
                    pattern: { value: /^[A-Za-z0-9]{2}$/, message: 'Solo letras y números, 2 caracteres' }
                })}
                max={2}
            />

            <TextInput
                label="Código ICAO"
                placeholder="Ej: CMP (3-4 caracteres)"
                error={errors.icao?.message}
                {...register('icao', {
                    required: 'El código ICAO es obligatorio',
                    minLength: { value: 3, message: 'Mínimo 3 caracteres' },
                    maxLength: { value: 4, message: 'Máximo 4 caracteres' },
                    pattern: { value: /^[A-Za-z0-9]{3,4}$/, message: 'Solo letras y números, 3 o 4 caracteres' }
                })}
            />

            <TextInput
                label="Nombre oficial"
                placeholder="Nombre completo de la aerolínea"
                error={errors.officialName?.message}
                {...register('officialName', { required: 'El nombre oficial es obligatorio' })}
            />

            <TextInput
                label="Nombre comercial"
                placeholder="Nombre que se muestra al usuario"
                error={errors.displayName?.message}
                {...register('displayName', { required: 'El nombre comercial es obligatorio' })}
            />

            {/* Bloque de imagen del logo */}
            <Paper withBorder p="sm" radius="md">
                <Text size="sm" fw={500} mb="xs">Logo de la aerolínea</Text>
                <Group align="flex-end" gap="md">
                    {previewUrl ? (
                        <Image
                            src={previewUrl}
                            alt="Logo preview"
                            width={80}
                            height={40}
                            fit="contain"
                            fallbackSrc="https://placehold.co/80x40?text=Logo"
                        />
                    ) : (
                        <Flex style={{ justifyContent: 'center', width: "100%" }}>
                            <Box
                                style={{
                                    width: "120px",
                                    height: '40px',
                                    border: '1px solid #ebebeb',
                                    borderRadius: '8px'
                                }}
                            />
                        </Flex>
                    )}
                </Group>
                <Text size="xs" c="dimmed" mt="xs">
                    La URL se genera automáticamente con el código <strong>IATA</strong>
                </Text>
            </Paper>

            <Controller
                name="active"
                control={control}
                defaultValue={true}
                render={({ field }) => (
                    <Switch
                        label="Activo"
                        checked={field.value}
                        onChange={(event) => field.onChange(event.currentTarget.checked)}
                        error={errors.active?.message}
                    />
                )}
            />

            <Button type="submit">{label}</Button>
        </Stack>
    );
};