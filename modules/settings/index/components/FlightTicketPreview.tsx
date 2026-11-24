'use client';

import { Paper, Title, Text, Stack, Divider, Group, Box, Badge, Flex } from '@mantine/core';
import { IoAirplaneSharp } from 'react-icons/io5';

type Passenger = {
    name: string;
};

interface FlightTicketPreviewProps {
    companyName?: string;
    documentTitle?: string;
    defaultMessage?: string;
    passenger: Passenger;
    primaryColor?: string;
    secondaryColor?: string;
    textColor?: string;
}

export function FlightTicketPreview({
    companyName = "FlyControl",
    documentTitle = "Boleto Electrónico / E-Ticket",
    defaultMessage = "Este estilo será el predeterminado para PDFs y Correos electrónicos.",
    passenger,
    primaryColor = "#1e3a8a", // Fallback azul
    secondaryColor = "#f59e0b", // Fallback naranja
    textColor = "#1f2937" // Fallback gris oscuro
}: FlightTicketPreviewProps) {
    
    const bgLight = '#f8fafc';
    const borderColor = '#e2e8f0';
    const textMuted = '#64748b';

    return (
        <Paper withBorder radius="md" style={{ overflow: 'hidden', backgroundColor: '#fff' }} shadow='sm'>
            <Stack gap="md" p="md">
                
                {/* HEADER */}
                <Box pb="xs" style={{ borderBottom: `4px solid ${primaryColor}` }}>
                    <Flex justify="space-between" align="flex-end">
                        <Box>
                            <Title order={3} fw={800} style={{ color: primaryColor, lineHeight: 1 }}>
                                {companyName}
                            </Title>
                            <Text size="xs" c={textMuted} tt="uppercase" mt={4}>
                                {documentTitle}
                            </Text>
                        </Box>
                        <Text size="xs" c={textMuted} fs="italic" ta="right">
                            {defaultMessage}
                        </Text>
                    </Flex>
                </Box>

                {/* PNR & QR */}
                <Flex 
                    justify="space-between" 
                    align="center" 
                    bg={bgLight} 
                    p="sm" 
                    style={{ borderRadius: 8, border: `1px solid ${borderColor}` }}
                >
                    <Box>
                        <Text size="xs" c={textMuted} tt="uppercase" fw={600} style={{ letterSpacing: 1 }}>PNR</Text>
                        <Text size="xl" fw={800} style={{ color: primaryColor, lineHeight: 1 }}>ABC123</Text>
                    </Box>
                    <Box>
                        <Text size="xs" c={textMuted} tt="uppercase" fw={600} style={{ letterSpacing: 1 }}>Ticket</Text>
                        <Text size="md" fw={700} style={{ color: textColor }}>1234567890</Text>
                    </Box>
                    {/* Simulador del QR */}
                    <Box w={50} h={50} bg="white" style={{ border: `1px solid ${borderColor}`, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Text size="xs" c="dimmed" fw={700}>QR</Text>
                    </Box>
                </Flex>

                {/* PASAJERO */}
                <Box>
                    <Text size="sm" fw={700} style={{ color: primaryColor, borderBottom: `2px solid ${borderColor}`, paddingBottom: 4, marginBottom: 8, textTransform: 'uppercase' }}>
                        Datos del Pasajero
                    </Text>
                    <Text size="lg" fw={700} style={{ color: textColor }}>{passenger.name.toUpperCase()}</Text>
                    <Group gap="xs" mt={4}>
                        <Text size="xs" c={textMuted} w={70}>Pasaporte:</Text>
                        <Text size="xs" fw={500} style={{ color: textColor }}>L998981</Text>
                    </Group>
                    <Group gap="xs">
                        <Text size="xs" c={textMuted} w={70}>Nacionalidad:</Text>
                        <Text size="xs" style={{ color: textColor }}>Cubana</Text>
                    </Group>
                </Box>

                {/* ITINERARIO (Tarjeta de Vuelo) */}
                <Box>
                    <Text size="sm" fw={700} style={{ color: primaryColor, marginBottom: 8, textTransform: 'uppercase' }}>
                        Itinerario de Vuelo
                    </Text>
                    
                    <Box style={{ border: `1px solid ${borderColor}`, borderRadius: 8, overflow: 'hidden' }}>
                        {/* Header Vuelo */}
                        <Flex justify="space-between" align="center" bg={bgLight} p="xs" style={{ borderBottom: `1px dashed ${borderColor}` }}>
                            <Text size="xs" fw={700} style={{ color: secondaryColor }}>VUELO DE IDA</Text>
                            <Text size="xs" fw={700} style={{ color: textColor }}>FLY ALWAYS | DO823</Text>
                        </Flex>
                        
                        {/* Cuerpo Vuelo */}
                        <Box p="sm">
                            <Flex justify="space-between" align="center">
                                {/* Salida */}
                                <Stack gap={0}>
                                    <Text size="xl" fw={800} style={{ color: textColor, lineHeight: 1 }}>SCU</Text>
                                    <Text size="sm" fw={700} style={{ color: primaryColor }}>10:50</Text>
                                    <Text size="xs" c={textMuted}>19 Nov, 2026</Text>
                                </Stack>

                                {/* Línea Central */}
                                <Stack gap={2} align="center" style={{ flex: 1, padding: '0 10px' }}>
                                    <Text size="xs" c={textMuted}>1h 20m</Text>
                                    <Flex w="100%" align="center">
                                        <Divider style={{ flex: 1, borderStyle: 'dashed', borderColor: textMuted }} />
                                        <Box mx={4} style={{ display: 'flex', alignItems: 'center' }}>
                                            <IoAirplaneSharp size={14} color={secondaryColor} />
                                        </Box>
                                        <Divider style={{ flex: 1, borderStyle: 'dashed', borderColor: textMuted }} />
                                    </Flex>
                                    <Text size="xs" c={textMuted}>ECONOMY</Text>
                                </Stack>

                                {/* Llegada */}
                                <Stack gap={0} align="flex-end">
                                    <Text size="xl" fw={800} style={{ color: textColor, lineHeight: 1 }}>SDQ</Text>
                                    <Text size="sm" fw={700} style={{ color: primaryColor }}>12:10</Text>
                                    <Text size="xs" c={textMuted}>19 Nov, 2026</Text>
                                </Stack>
                            </Flex>
                        </Box>
                    </Box>
                </Box>

                {/* FOOTER SIMULADO */}
                <Flex justify="space-between" mt="xs" pt="sm" style={{ borderTop: `1px solid ${borderColor}` }}>
                    <Text size="xs" c={textMuted}>Generado por FlyControl</Text>
                    <Text size="xs" c={textMuted}>www.flycontrol.com</Text>
                </Flex>

            </Stack>
        </Paper>
    );
}