import { ClientType, ClientTypeType } from "@/types/ModelsType";
import {
    Button,
    Stack,
    TextInput,
    Select,
    Alert,
} from "@mantine/core";
import { DateInput } from '@mantine/dates'; // 👈 Usamos DateInput
import { Control, Controller, FieldErrors, UseFormGetValues, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { useEffect, useState } from "react";
import dayjs from "dayjs";

type Props = {
    label: string;
    errors: FieldErrors<ClientType>;
    control: Control<any, any, any>;
    register: UseFormRegister<ClientType>;
    setValue: UseFormSetValue<ClientType>;
    getValues: UseFormGetValues<ClientType>;
    watch: UseFormWatch<ClientType>;
};

const typeOptions = [
    { value: "INFANT", label: "Infante (0-23 meses)" },
    { value: "CHILD", label: "Niño (2-11 años)" },
    { value: "ADULT", label: "Adulto (12+ años)" },
];

export const FormClient = ({
    label,
    errors,
    control,
    register,
    setValue,
    getValues,
    watch,
}: Props) => {
    const [ageWarning, setAgeWarning] = useState<string | null>(null);
    const birthDate = watch("birthDate");
    const selectedType = watch("type");

    useEffect(() => {
        if (!birthDate) {
            setAgeWarning(null);
            return;
        }
        const birth = new Date(birthDate);
        if (isNaN(birth.getTime())) {
            setAgeWarning(null);
            return;
        }
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        let expectedType: ClientTypeType | null = null;
        if (age < 2) expectedType = "INFANT";
        else if (age <= 11) expectedType = "CHILD";
        else expectedType = "ADULT";

        if (expectedType && selectedType && selectedType !== expectedType) {
            setAgeWarning(`La edad del pasajero es ${age} años. El tipo correcto debería ser ${typeOptions.find(t => t.value === expectedType)?.label}.`);
        } else {
            setAgeWarning(null);
        }
    }, [birthDate, selectedType]);

    // Helper para convertir el Date que devuelve Mantine a tu formato ISO con hora 12:00
    const handleDateChange = (date: Date | string | null, fieldOnChange: (val: any) => void) => {
        if (!date) {
            fieldOnChange(null);
            return;
        }

        // Usamos dayjs para parsear de forma segura, venga como Date o string
        const dateStr = dayjs(date).format('YYYY-MM-DD');

        // Validamos que dayjs haya podido interpretar la fecha
        if (dateStr === 'Invalid Date') return;

        fieldOnChange(`${dateStr}T12:00:00.000Z`);
    };

    return (
        <Stack gap="md">
            <TextInput
                label="Nombre completo"
                placeholder="Ej: Juan Pérez García"
                withAsterisk
                error={errors.fullName?.message}
                {...register("fullName", { required: "El nombre completo es obligatorio" })}
            />

            <TextInput
                label="Número de pasaporte"
                placeholder="Ej: AB123456"
                withAsterisk
                error={errors.passportNumber?.message}
                {...register("passportNumber", {
                    required: "El número de pasaporte es obligatorio",
                    pattern: {
                        value: /^[A-Z0-9]{6,12}$/i,
                        message: "Formato inválido (solo letras y números, 6-12 caracteres)",
                    },
                })}
            />

            <TextInput
                label="Correo electrónico (opcional)"
                placeholder="cliente@ejemplo.com"
                error={errors.email?.message}
                {...register("email", {
                    pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Correo electrónico inválido",
                    },
                })}
            />

            <TextInput
                label="Teléfono"
                placeholder="+34 600 000 000"
                withAsterisk
                error={errors.phone?.message}
                {...register("phone", { required: "El teléfono es obligatorio" })}
            />

            {/* 👇 FECHA DE EMISIÓN */}
            <Controller
                name="passportIssueDate"
                control={control}
                render={({ field }) => (
                    <DateInput
                        label="Fecha de emisión del pasaporte (opcional)"
                        placeholder="DD/MM/YYYY"
                        valueFormat="DD/MM/YYYY"
                        value={field.value ? new Date(field.value) : null}
                        onChange={(date) => handleDateChange(date, field.onChange)}
                        error={errors.passportIssueDate?.message}
                        clearable
                    />
                )}
            />

            {/* 👇 FECHA DE VENCIMIENTO */}
            <Controller
                name="passportExpiryDate"
                control={control}
                rules={{ required: "La fecha de vencimiento del pasaporte es obligatoria" }}
                render={({ field }) => (
                    <DateInput
                        label="Fecha de vencimiento del pasaporte"
                        placeholder="DD/MM/YYYY"
                        withAsterisk
                        valueFormat="DD/MM/YYYY"
                        value={field.value ? new Date(field.value) : null}
                        onChange={(date) => handleDateChange(date, field.onChange)}
                        error={errors.passportExpiryDate?.message}
                        minDate={new Date()}
                    />
                )}
            />

            {/* 👇 FECHA DE NACIMIENTO */}
            <Controller
                name="birthDate"
                control={control}
                rules={{ required: "La fecha de nacimiento es obligatoria" }}
                render={({ field }) => (
                    <DateInput
                        label="Fecha de nacimiento"
                        placeholder="DD/MM/YYYY"
                        withAsterisk
                        valueFormat="DD/MM/YYYY"
                        value={field.value ? new Date(field.value) : null}
                        onChange={(date) => handleDateChange(date, field.onChange)}
                        error={errors.birthDate?.message}
                        maxDate={new Date()}
                    />
                )}
            />

            <Controller
                name="type"
                control={control}
                rules={{ required: "Debe seleccionar un tipo de pasajero" }}
                render={({ field }) => (
                    <Select
                        label="Tipo de pasajero"
                        placeholder="Seleccione una opción"
                        data={typeOptions}
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.type?.message}
                        withAsterisk
                    />
                )}
            />

            {ageWarning && (
                <Alert color="yellow" title="Advertencia de edad" variant="light">
                    {ageWarning}
                </Alert>
            )}

            <TextInput
                label="Nacionalidad"
                placeholder="Ej: Española, Mexicana, Argentina"
                withAsterisk
                error={errors.nationality?.message}
                {...register("nationality", { required: "La nacionalidad es obligatoria" })}
            />

            <Button type="submit" mt="md">{label}</Button>
        </Stack>
    );
};