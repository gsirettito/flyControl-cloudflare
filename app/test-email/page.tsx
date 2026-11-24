'use client';

import { useState } from 'react';
import { Container, Paper, Title, TextInput, Button, Text, Stack, Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { FiSend } from 'react-icons/fi';

export default function TestEmailPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success?: boolean; msg?: string } | null>(null);

    const handleSend = async () => {
        if (!email) {
            notifications.show({ title: 'Error', message: 'Escribe un correo de destino', color: 'red' });
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const res = await fetch('/api/test-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Error al enviar el correo');

            setResult({ success: true, msg: '¡Correo enviado con éxito! Revisa tu bandeja de entrada (y la carpeta de Spam).' });
            setEmail('');
        } catch (error: any) {
            setResult({ success: false, msg: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container size="sm" py="xl">
            <Paper withBorder shadow="md" p="xl" radius="md">
                <Stack>
                    <Title order={2} ta="center">Probar Envío de Correos</Title>
                    <Text c="dimmed" ta="center" size="sm">
                        Ingresa un correo para probar tu configuración de Nodemailer (SMTP).
                    </Text>

                    <TextInput
                        label="Correo de destino"
                        placeholder="ejemplo@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.currentTarget.value)}
                        leftSection={<FiSend size={16} />}
                        mt="md"
                    />

                    <Button
                        onClick={handleSend}
                        loading={loading}
                        fullWidth
                        mt="md"
                        variant="filled"
                    >
                        Enviar Correo de Prueba
                    </Button>

                    {result && (
                        <Alert
                            color={result.success ? 'green' : 'red'}
                            title={result.success ? 'Éxito' : 'Error'}
                            mt="md"
                        >
                            {result.msg}
                        </Alert>
                    )}
                </Stack>
            </Paper>
        </Container>
    );
}