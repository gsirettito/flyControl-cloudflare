import { primary } from "@/components/ui/Theme/color";
import { FlightType } from "@/types/ModelsType";
import { Box, Card, Group, Badge, ActionIcon, Text, Flex } from "@mantine/core";
import { FiTrash2 } from "react-icons/fi";
import { IoAirplaneSharp } from "react-icons/io5";
import { formatInTimeZone } from 'date-fns-tz'; // 🔥 Importamos formatInTimeZone

export const ItemFly = ({
    flight,
    removeDepartureFlight
}: {
    flight: FlightType,
    removeDepartureFlight: () => void
}) => {
    // Calcular duración del vuelo en minutos
    const dep = new Date(flight.departureTime);
    const arr = new Date(flight.arrivalTime);
    const diffMinutes = Math.round((arr.getTime() - dep.getTime()) / 60000);
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    return (
        <Box style={{ position: 'relative', paddingLeft: '24px' }}>
            {/* Línea vertical conectora */}
            <Box style={{ position: 'absolute', left: '12px', top: '0px', bottom: '12px', width: '2px', height: '100%', backgroundColor: primary[5] }} />
            <Box style={{ position: 'relative' }}>
                {/* Círculo indicador */}
                <Box style={{
                    position: 'absolute',
                    left: '-19px',
                    top: '16px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: primary[5],
                    border: '3px solid white',
                    zIndex: 1
                }} />
                <Card withBorder p="sm" radius="md" ml="md" shadow="0" mb={12}>
                    <Group justify="space-between" wrap="nowrap">
                        <Group gap="xs">
                            <Badge variant="filled" color="primary" size="lg">
                                {flight.flightNumber}
                            </Badge>
                            <Text fw={500}>{flight.origin} → {flight.destination}</Text>
                        </Group>
                        <ActionIcon variant="light" color="red" onClick={() => removeDepartureFlight()}>
                            <FiTrash2 size={12} />
                        </ActionIcon>
                    </Group>

                    {/* Horarios y duración */}
                    <Flex align="center" gap="8px" mt="xs" wrap="wrap">
                        <Text size="xs" flex={1}>
                            <Text span c="dimmed">Salida: </Text>
                            {/* 🔥 Usamos la zona horaria del origen dinámicamente */}
                            {formatInTimeZone(dep, flight.originTimezone || 'UTC', 'dd/MM/yyyy HH:mm')}
                        </Text>
                        <Flex gap="4px" align="center">
                            <IoAirplaneSharp size={14} color={primary[5]} />
                            <Text size="xs" c="primary" fw={500}>
                                {duration}
                            </Text>
                        </Flex>
                        <Text size="xs" flex={1} ta="right">
                            <Text span c="dimmed">Llegada: </Text>
                            {/* 🔥 Usamos la zona horaria del destino dinámicamente */}
                            {formatInTimeZone(arr, flight.destinationTimezone || 'UTC', 'dd/MM/yyyy HH:mm')}
                        </Text>
                    </Flex>

                    {/* Nombres de aeropuertos */}
                    {flight.originName && flight.destinationName && (
                        <Text size="xs" c="dimmed" mt={4}>
                            {flight.originName} → {flight.destinationName}
                        </Text>
                    )}
                </Card>
            </Box>
        </Box>
    );
};