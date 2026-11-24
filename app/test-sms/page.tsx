// app/test-sms/page.tsx
'use client';

import { useState } from 'react';
import { TextInput, Textarea, Button, Stack, Card, Title, Text, Code, Switch, Group, Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { FiSend, FiInfo } from 'react-icons/fi';

export default function TestSmsPage() {
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('Hola, este es un mensaje de prueba desde FlyControl.');
    const [isSandbox, setIsSandbox] = useState(true); // Por defecto en true para no gastar saldo
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<any>(null);

    const handleSend = async () => {
        if (!phone || !message) {
            notifications.show({ title: 'Atención', message: 'Debes rellenar el teléfono y el mensaje', color: 'orange' });
            return;
        }

        setLoading(true);
        setResponse(null);

        try {
            const res = await fetch('/api/test-sms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone,
                    message,
                    isSandbox
                }),
            });

            const data = await res.json();
            setResponse(data);

            if (res.ok) {
                notifications.show({
                    title: 'Éxito',
                    message: isSandbox ? 'Simulación exitosa (No se gastó saldo)' : 'SMS enviado correctamente',
                    color: 'green',
                });
            } else {
                notifications.show({
                    title: 'Error',
                    message: data.error || 'Error al enviar',
                    color: 'red',
                });
            }
        } catch (error) {
            notifications.show({ title: 'Error de Red', message: 'No se pudo conectar con el servidor', color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Stack align="center" mt="xl" px="md">
            <Card withBorder shadow="sm" radius="md" p="xl" w={500}>
                <Title order={2} mb="xs">Probar Envío de SMS</Title>
                <Text size="sm" c="dimmed" mb="lg">
                    Utiliza esta página para verificar que la integración con la API de NoxCreation funciona.
                </Text>

                <Stack gap="md">
                    <Alert icon={<FiInfo />} color="blue" variant="light">
                        El número debe tener el formato de Cuba. Si solo pones 8 dígitos (ej: 55512345), el sistema le añadirá el +53 automáticamente.
                    </Alert>

                    <TextInput
                        label="Número de Teléfono"
                        placeholder="Ej: 55512345 o +5355512345"
                        value={phone}
                        onChange={(e) => setPhone(e.currentTarget.value)}
                        required
                    />

                    <Textarea
                        label="Mensaje"
                        placeholder="Escribe el mensaje..."
                        value={message}
                        onChange={(e) => setMessage(e.currentTarget.value)}
                        minRows={3}
                        maxLength={160} // Límite recomendado para 1 SMS
                        required
                    />

                    <Group justify="space-between" align="center">
                        <Text size="xs" c="dimmed">{message.length}/160 caracteres</Text>
                        <Switch
                            label="Modo Sandbox (No gastar saldo)"
                            checked={isSandbox}
                            onChange={(e) => setIsSandbox(e.currentTarget.checked)}
                            color="orange"
                        />
                    </Group>

                    <Button
                        onClick={handleSend}
                        loading={loading}
                        leftSection={<FiSend />}
                        color={isSandbox ? 'orange' : 'blue'}
                    >
                        {isSandbox ? 'Simular Envío' : 'Enviar SMS Real'}
                    </Button>
                </Stack>

                {response && (
                    <Stack mt="xl">
                        <Text fw={600} size="sm">Respuesta del Servidor:</Text>
                        <Code block style={{ whiteSpace: 'pre-wrap' }}>
                            {JSON.stringify(response, null, 2)}
                        </Code>
                    </Stack>
                )}
            </Card>
        </Stack>
    );
}