import { UserType } from "@/types/ModelsType";
import { ActionIcon, Button, CopyButton, Stack, Textarea, TextInput, Tooltip, Text, Checkbox, Radio, Group } from "@mantine/core"
import { useEffect, useState } from "react";
import { FieldErrors, UseFormGetValues, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { FiCheck, FiCopy } from "react-icons/fi";

type Props = {
    label: string;
    errors: FieldErrors<UserType>;
    register: UseFormRegister<UserType>;
    setValue: UseFormSetValue<UserType>;
    getValues: UseFormGetValues<UserType>;
    watch: UseFormWatch<UserType>
};

export const FormManager = ({
    label,
    errors,
    register,
    setValue,
    getValues,
    watch
}: Props) => {

    useEffect(() => {
        if (!getValues('id')) {
            setValue("isManager", true)
        }
    }, [])

    return (
        <Stack gap={6}>
            <TextInput
                label="Nombre Usuario"
                placeholder="Pedro Perez"
                error={errors.name?.message}
                withAsterisk
                {...register('name', { required: 'El nombre es obligatorio' })}
            />

            <TextInput
                label="Correo Electrónico"
                placeholder="pedro.perez@example.com"
                error={errors.email?.message}
                withAsterisk
                {...register('email', { required: 'El correo electrónico es obligatorio' })}
            />

            <Radio.Group
                name="favoriteFramework"
                label="Seleccione el ROL"
                withAsterisk
                value={watch('isAdmin') ? 'admin' : 'manager'}
                onChange={(opt) => {
                    switch (opt) {
                        case "manager":
                            setValue('isManager', true)
                            setValue('isAdmin', false)
                            break
                        case "admin":
                            setValue('isManager', false)
                            setValue('isAdmin', true)
                            break
                    }
                }}
            >
                <Group mt="xs">
                    <Radio
                        label="Es Gestor"
                        value="manager"
                    />
                    <Radio
                        label="Es Administrador"
                        value="admin"
                    />
                </Group>
            </Radio.Group>

            {/* <Checkbox
                label="Es Gestor"
                error={errors.isManager?.message}
                {...register('isManager', { required: 'Es obligatorio' })}
            />

            <Checkbox
                label="Es Administrador"
                error={errors.isAdmin?.message}
                {...register('isAdmin', { required: 'Es obligatorio' })}
            /> */}

            <Button type="submit">{label}</Button>
        </Stack>
    )
}