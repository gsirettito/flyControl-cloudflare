'use client';

import { primary } from '@/components/ui/Theme/color';
import { CompanyType } from '@/types/ModelsType';
import { Box, Container, Paper, Title, TextInput, Button, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';

export const WizardIndex = () => {
    const [loading, setLoading] = useState(false)
    const { update } = useSession(); // <-- 2. Obtener la función update
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<CompanyType>();

    const onSave = async (data: CompanyType) => {
        try {
            setLoading(true)
            const response = await fetch('/api/system/company', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    commercialName: data.commercialName,
                    phone: data.phone,
                    address: data.address,
                }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            // Éxito: redirigir al home (el usuario ya tiene compañía)

            // 🔥 3. ACTUALIZAMOS LA SESIÓN ANTES DE REDIRIGIR
            await update({ companyId: result.company?.id || result.id || result.companyId });

            // 4. Redirigimos al home
            window.location.href = '/home';
        } catch (error: any) {
            console.error(error);
            notifications.show({
                title: 'Error',
                message: error.message,
                color: 'red'
            })
        }
        setLoading(false)
    };

    return (
        <Box style={{ minHeight: "100vh", backgroundColor: primary[0], overflow: 'hidden' }}>
            <Container size="sm" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

                <Paper
                    withBorder
                    radius="md"
                    p="xl"
                    style={{ width: '100%', maxWidth: 450 }}
                >
                    <form onSubmit={handleSubmit(onSave)}>
                        <Stack gap="md">
                            <Title order={2} ta="center" style={{ color: primary[7] }}>
                                Configura tu compañía
                            </Title>
                            <Text size="sm" c="dimmed" ta="center">
                                Completa los datos para comenzar a usar FlyControl
                            </Text>

                            <TextInput
                                label="Nombre comercial"
                                placeholder="Ej: Tours Express LLC"
                                withAsterisk
                                error={errors.commercialName?.message}
                                {...register("commercialName", { required: "El nombre completo es obligatorio" })}
                            />
                            <TextInput
                                label="Teléfono"
                                placeholder="+1 (868) ***-****"
                                withAsterisk
                                error={errors.phone?.message}
                                {...register("phone", { required: "El teléfono es obligatorio" })}
                            />
                            <TextInput
                                label="Dirección"
                                placeholder="Calle Principal #123, Ciudad"
                                withAsterisk
                                error={errors.address?.message}
                                {...register("address", { required: "La dirección es obligatoria" })}
                            />

                            <Button
                                fullWidth
                                mt="md"
                                style={{ backgroundColor: primary[4] }}
                                type='submit'
                                loading={loading}
                            >
                                Guardar y continuar
                            </Button>
                        </Stack>
                    </form>
                </Paper>
            </Container>
        </Box>
    );
};