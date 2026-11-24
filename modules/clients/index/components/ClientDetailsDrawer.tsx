'use client';

import { Drawer, Stack, Group, Text, Badge, Divider, Grid, Box } from '@mantine/core';
import { ClientType } from '@/types/ModelsType';
import dayjs from 'dayjs';

interface ClientDetailsDrawerProps {
    opened: boolean;
    onClose: () => void;
    client: ClientType | null;
}

export function ClientDetailsDrawer({ opened, onClose, client }: ClientDetailsDrawerProps) {
    if (!client) return null;

    return (
        <Drawer
            opened={opened}
            onClose={onClose}
            title="Detalles del Cliente"
            position="right"
            size="md"
            padding="md"
        >
            <Stack gap="lg">
                {/* Cabecera */}
                <Box>
                    <Text size="xl" fw={700}>{client.fullName}</Text>
                    <Group gap="xs" mt="xs">
                        <Badge color={client.type === 'ADULT' ? 'blue' : client.type === 'CHILD' ? 'teal' : 'orange'}>
                            {client.type}
                        </Badge>
                        <Text size="sm" c="dimmed">Creado el {dayjs(client.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
                    </Group>
                </Box>

                <Divider />

                {/* Datos de Contacto */}
                <Box>
                    <Text fw={600} mb="xs" size="sm" c="dimmed" tt="uppercase">Contacto</Text>
                    <Grid>
                        <Grid.Col span={6}>
                            <Text size="sm" fw={500}>Email</Text>
                            <Text size="sm" c="dimmed">{client.email || 'No registrado'}</Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Text size="sm" fw={500}>Teléfono</Text>
                            <Text size="sm" c="dimmed">{client.phone}</Text>
                        </Grid.Col>
                    </Grid>
                </Box>

                <Divider />

                {/* Datos del Pasaporte */}
                <Box>
                    <Text fw={600} mb="xs" size="sm" c="dimmed" tt="uppercase">Documentación</Text>
                    <Grid>
                        <Grid.Col span={12}>
                            <Text size="sm" fw={500}>Pasaporte</Text>
                            <Text size="sm" c="dimmed">{client.passportNumber}</Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Text size="sm" fw={500}>Nacionalidad</Text>
                            <Text size="sm" c="dimmed">{client.nationality}</Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Text size="sm" fw={500}>Fecha de Nacimiento</Text>
                            <Text size="sm" c="dimmed">{dayjs(client.birthDate).format('DD/MM/YYYY')}</Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Text size="sm" fw={500}>Emisión del Pasaporte</Text>
                            <Text size="sm" c="dimmed">
                                {client.passportIssueDate ? dayjs(client.passportIssueDate).format('DD/MM/YYYY') : 'No registrada'}
                            </Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Text size="sm" fw={500}>Vencimiento del Pasaporte</Text>
                            <Text size="sm" c={dayjs(client.passportExpiryDate).isBefore(dayjs()) ? 'red' : 'dimmed'}>
                                {dayjs(client.passportExpiryDate).format('DD/MM/YYYY')}
                                {dayjs(client.passportExpiryDate).isBefore(dayjs()) && ' (Vencido)'}
                            </Text>
                        </Grid.Col>
                    </Grid>
                </Box>
            </Stack>
        </Drawer>
    );
}