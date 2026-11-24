'use client';

import { Button, ButtonVariant, Drawer, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FormProvider, useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { notifications } from '@mantine/notifications';
import { forwardRef, useImperativeHandle } from "react";

type Props = {
    apiUrl: string;
    label: string;
    buttonLabel: string;
    form: any;
    model?: string;
    exclude?: string[];
    defaultValues?: Record<string, any>; // 🔥 NUEVO PARÁMETRO
    onSuccess?: () => void;
    onClick?: () => void;
    onSubmitReplace?: (data: any, onClose: () => void) => void;
    variant?: ButtonVariant
}

export interface ButtonAddRef {
    showEdit: (initialize: any) => void;
    showCreate: () => void;
}

export const ButtonAdd = forwardRef<ButtonAddRef, Props>(function DataTable(
    { apiUrl, label, buttonLabel, form, model, exclude, defaultValues, variant = 'filled', onSuccess, onClick, onSubmitReplace },
    ref
) {
    const [opened, { open, close }] = useDisclosure(false);
    const { data: session, status } = useSession();
    
    // 🔥 Inicializamos useForm con los defaultValues si existen
    const methods = useForm<any>({
        defaultValues: defaultValues || {}
    });
    
    const {
        control,
        watch,
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        getValues,
        reset
    } = methods;

    // Exponer función refresh al padre
    useImperativeHandle(ref, () => ({
        showEdit: (initialize: any) => {
            const keys = Object.keys(initialize)
            for (const key of keys) {
                setValue(key, initialize[key])
            }
            open()
        },
        showCreate: () => { // 👈 NUEVA FUNCIÓN
            reset(defaultValues || {}); 
            open();
        }
    }));

    const onSubmit = async (data: any) => {
        console.log("data", data)
        if (status !== 'authenticated' || !session?.user?.id) {
            notifications.show({
                title: 'Error',
                message: 'No has iniciado sesión',
                color: 'red',
            });
            return;
        }

        if (onSubmitReplace) {
            onSubmitReplace(data, close)
        } else {
            const userId = session.user.id;
            const payload = { ...data, userId };

            const url = new URL(apiUrl, window.location.origin);
            try {
                let res;
                if (data.id) {
                    if (exclude) {
                        for (const key of exclude) {
                            delete payload[key]
                        }
                    }
                    res = await fetch(url.toString(), {
                        method: "PUT",
                        headers: { 'Content-Type': 'application/json' }, // 🔥 Header añadido
                        body: JSON.stringify({
                            id: data.id,
                            data: { ...payload }
                        })
                    });
                } else {
                    res = await fetch(url.toString(), {
                        method: "POST",
                        headers: { 'Content-Type': 'application/json' }, // 🔥 Header añadido
                        body: JSON.stringify({ data: payload })
                    });
                }
                
                const result = await res.json();
                if (!res.ok) {
                    throw new Error(result.error || 'Error al crear el registro');
                }
                
                notifications.show({
                    title: 'Éxito',
                    message: `${label} creado correctamente`,
                    color: 'green',
                });
                
                // 🔥 Resetea a los valores por defecto (si los hay, si no, lo deja vacío)
                reset(defaultValues || {}); 
                close(); // cierra drawer
                onSuccess?.();
            } catch (error: any) {
                console.error(error);
                notifications.show({
                    title: 'Error',
                    message: error.message || 'Ocurrió un error inesperado',
                    color: 'red',
                });
            }
        }
    };

    const Component = form as any;
    return (
        <Stack>
            <Drawer opened={opened} onClose={close} title={label}>
                {opened && (
                    <FormProvider {...methods}>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Component register={register} control={control} errors={errors} setValue={setValue} getValues={getValues} watch={watch} label={label} />
                        </form>
                    </FormProvider>
                )}
            </Drawer>
            <Button onClick={() => {
                // 🔥 Al abrir, aplicamos los valores por defecto
                reset(defaultValues || {}); 
                open();
                onClick?.();
            }} variant={variant} >{buttonLabel}</Button>
        </Stack>
    );
})