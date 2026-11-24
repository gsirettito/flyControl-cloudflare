import { CompanyType } from "@/types/ModelsType";
import {
    ActionIcon,
    Button,
    CopyButton,
    Stack,
    Textarea,
    TextInput,
    Tooltip,
    Text,
    ColorInput,
} from "@mantine/core";
import { useEffect } from "react";
import { Control, Controller, FieldErrors, UseFormGetValues, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { FiCheck, FiCopy } from "react-icons/fi";

type Props = {
    label: string;
    errors: FieldErrors<CompanyType>;
    control: Control<any, any, any>;
    register: UseFormRegister<CompanyType>;
    setValue: UseFormSetValue<CompanyType>;
    getValues: UseFormGetValues<CompanyType>
};

// Paleta de colores predefinida (puedes modificarla)
const colorSwatches = [
    '#25262b', '#868e96', '#fa5252', '#e64980', '#be4bdb',
    '#7950f2', '#4c6ef5', '#228be6', '#15aabf', '#12b886',
    '#40c057', '#82c91e', '#fab005', '#fd7e14',
];

export const FormCompany = ({
    label,
    errors,
    control,
    register
}: Props) => {

    return (
        <Stack gap={6}>
            <TextInput
                label="Nombre Comercial"
                placeholder="Ingrese el nombre comercial de la empresa"
                error={errors.commercialName?.message}
                {...register('commercialName', { required: 'El nombre comercial es obligatorio' })}
            />

            <Controller
                name="primaryColor"
                control={control}
                rules={{ required: 'El color primario es obligatorio' }}
                render={({ field }) => (
                    <ColorInput
                        label="Color Primario"
                        placeholder="Seleccione un color"
                        format="hex"
                        swatches={colorSwatches}
                        error={errors.primaryColor?.message}
                        {...field}
                    />
                )}
            />

            <Controller
                name="secondaryColor"
                control={control}
                rules={{ required: 'El color secundario es obligatorio' }}
                render={({ field }) => (
                    <ColorInput
                        label="Color Secundario"
                        placeholder="Seleccione un color"
                        format="hex"
                        swatches={colorSwatches}
                        error={errors.secondaryColor?.message}
                        {...field}
                    />
                )}
            />

            <Controller
                name="textColor"
                control={control}
                rules={{ required: 'El color del texto es obligatorio' }}
                render={({ field }) => (
                    <ColorInput
                        label="Color Del Texto"
                        placeholder="Seleccione un color"
                        format="hex"
                        swatches={colorSwatches}
                        error={errors.textColor?.message}
                        {...field}
                    />
                )}
            />

            <TextInput
                label="Teléfono"
                placeholder="Ingrese el teléfono de la empresa"
                error={errors.phone?.message}
                {...register('phone', { required: 'El teléfono es obligatorio' })}
            />

            <TextInput
                label="Dirección"
                placeholder="Ingrese la dirección de la empresa"
                error={errors.address?.message}
                {...register('address', { required: 'La dirección es obligatoria' })}
            />

            <TextInput
                label="Prefijo de Ticket"
                placeholder="Ingrese el prefijo de ticket"
                error={errors.ticketPrefix?.message}
                {...register('ticketPrefix', { required: 'El prefijo de ticket es obligatorio' })}
            />

            <TextInput
                label="Horas de Expiración de Reserva"
                placeholder="Ingrese las horas de expiración de la reserva"
                error={errors.preReservationExpiryHours?.message}
                {...register('preReservationExpiryHours', { required: 'Las horas de expiración de la reserva es obligatorio' })}
                type="number"
            />

            <Button type="submit">{label}</Button>
        </Stack>
    )
}