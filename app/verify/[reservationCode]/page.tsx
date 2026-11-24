// app/verify/[reservationCode]/page.tsx

import { prisma } from '@/utils/prisma';
import { Box, Stack, Group, Text, Badge, Image, Flex, Divider } from '@mantine/core';
import { formatInTimeZone } from 'date-fns-tz';
import { IoAirplaneSharp } from 'react-icons/io5';
import { FaCheckCircle, FaClock, FaTimesCircle, FaSuitcase, FaShieldAlt } from 'react-icons/fa';

export const dynamic = 'force-dynamic';

const getContrastColor = (hex: string) => {
  if (!hex) return '#ffffff';
  const cleanedHex = hex.replace('#', '');
  if (cleanedHex.length !== 6) return '#ffffff';
  const r = parseInt(cleanedHex.substring(0, 2), 16);
  const g = parseInt(cleanedHex.substring(2, 4), 16);
  const b = parseInt(cleanedHex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#1e2a48' : '#ffffff';
};

const formatDuration = (dep: Date, arr: Date) => {
  const diff = arr.getTime() - dep.getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
};

export default async function Verify({ params }: { params: Promise<{ reservationCode: string }> }) {
  const { reservationCode } = await params;

  // 🔒 FIX: Usamos 'select' en lugar de 'include' para no filtrar datos privados (Pasaporte, Email, etc.)
  const reservation = await prisma.reservation.findFirst({
    where: {
      OR: [
        { id: reservationCode },
        { reservationCode: reservationCode }
      ]
    },
    select: {
      id: true,
      reservationCode: true,
      status: true,
      pnr: true,
      baggage: true,
      passenger: {
        select: { fullName: true } // 🔒 Solo el nombre es público
      },
      company: {
        select: {
          commercialName: true,
          logoUrl: true,
          primaryColor: true,
          secondaryColor: true,
          textColor: true
        }
      },
      departureFlights: {
        select: {
          flight: {
            select: {
              flightNumber: true,
              origin: true,
              originName: true,
              destination: true,
              destinationName: true,
              departureTime: true,
              arrivalTime: true,
              originTimezone: true,
              destinationTimezone: true,
              airline: { select: { displayName: true } }
            }
          }
        }
      },
      returnFlights: {
        select: {
          flight: {
            select: {
              flightNumber: true,
              origin: true,
              originName: true,
              destination: true,
              destinationName: true,
              departureTime: true,
              arrivalTime: true,
              originTimezone: true,
              destinationTimezone: true,
              airline: { select: { displayName: true } }
            }
          }
        }
      }
    }
  });

  if (!reservation) {
    return (
      <Box style={{ backgroundColor: '#f6f7f9', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <Stack align="center" gap="md" ta="center">
          <FaTimesCircle size={48} color="#fa5252" />
          <Text size="xl" fw={700} style={{ color: '#1e2a48' }}>Reserva no encontrada</Text>
          <Text size="sm" c="dimmed">El código de reserva <strong>{reservationCode}</strong> no es válido o ha expirado.</Text>
        </Stack>
      </Box>
    );
  }

  const allFlights = [
    ...reservation.departureFlights.map(f => ({ ...f.flight, type: 'IDA' })),
    ...reservation.returnFlights.map(f => ({ ...f.flight, type: 'REGRESO' }))
  ];

  const statusConfig = {
    PENDING: { color: '#f7be22', icon: <FaClock />, label: 'PENDIENTE' },
    CONFIRMED: { color: '#2f9e44', icon: <FaCheckCircle />, label: 'CONFIRMADA' },
    REJECTED: { color: '#fa5252', icon: <FaTimesCircle />, label: 'CANCELADA' },
  };
  const statusInfo = statusConfig[reservation.status as keyof typeof statusConfig] || statusConfig.PENDING;
  const baggageText = reservation.baggage === 'SOLO_EQUIPAJE_MANO' ? 'Solo equipaje de mano' : 'Equipaje documentado';

  const primaryColor = reservation.company?.primaryColor || '#1e2a48';
  const secondaryColor = reservation.company?.secondaryColor || '#f7be22';
  const textColor = reservation.company?.textColor || '#1e2a48';
  const headerTextColor = getContrastColor(primaryColor);

  // ... El resto del JSX (que dibuja los vuelos) se mantiene EXACTAMENTE IGUAL que en tu código original.
  return (
    <Box style={{ backgroundColor: '#f1f3f5', minHeight: '100vh', padding: '20px 10px' }}>
      <Stack align="center" gap="xl" style={{ maxWidth: '450px', margin: '0 auto' }}>
        <Stack align="center" gap="xs">
          <FaShieldAlt size={40} color={primaryColor} />
          <Text fw={800} size="lg" style={{ color: textColor }}>Boleto Verificado</Text>
          <Text size="sm" c="dimmed" ta="center">
            Documento auténtico emitido por <strong>{reservation.company?.commercialName}</strong>
          </Text>
        </Stack>

        {allFlights.map((flight, idx) => {
          const depDate = new Date(flight.departureTime);
          const arrDate = new Date(flight.arrivalTime);
          const duration = formatDuration(depDate, arrDate);

          return (
            <Box key={idx} style={{ width: '100%', backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <Box style={{ backgroundColor: primaryColor, color: headerTextColor, padding: '20px' }}>
                <Flex justify="space-between" align="center" mb="xl">
                  <Group gap="xs">
                    <IoAirplaneSharp size={20} />
                    <Text fw={700} size="sm">{flight.airline?.displayName || 'VUELO'}</Text>
                  </Group>
                  <Badge color={secondaryColor} variant="filled" size="sm" radius="sm">{flight.type}</Badge>
                </Flex>

                <Flex justify="space-between" align="center" mb="xl">
                  <Stack gap={0} style={{ flex: 1 }}>
                    <Text size="xs" fw={500} style={{ opacity: 0.8 }}>FROM:</Text>
                    <Text fw={900} style={{ fontSize: '2.5rem', lineHeight: 1 }}>{flight.origin}</Text>
                    <Text size="xs" fw={600} lineClamp={1} style={{ opacity: 0.9 }}>{flight.originName}</Text>
                    <Text size="sm" fw={600} mt={4}>
                      {formatInTimeZone(depDate, flight.originTimezone || 'UTC', 'dd MMM yyyy')} <br />
                      {formatInTimeZone(depDate, flight.originTimezone || 'UTC', 'HH:mm')}
                    </Text>
                  </Stack>

                  <Stack align="center" gap={4} px="xs" style={{ flex: 0.5 }}>
                    <Text size="10px" fw={600} style={{ opacity: 0.8 }}>{duration}</Text>
                    <Box style={{ width: '100%', borderTop: `2px dashed ${headerTextColor}`, opacity: 0.4 }} />
                    <IoAirplaneSharp size={16} style={{ opacity: 0.8 }} />
                  </Stack>

                  <Stack gap={0} align="flex-end" style={{ flex: 1, textAlign: 'right' }}>
                    <Text size="xs" fw={500} style={{ opacity: 0.8 }}>TO:</Text>
                    <Text fw={900} style={{ fontSize: '2.5rem', lineHeight: 1 }}>{flight.destination}</Text>
                    <Text size="xs" fw={600} lineClamp={1} style={{ opacity: 0.9 }}>{flight.destinationName}</Text>
                    <Text size="sm" fw={600} mt={4}>
                      {formatInTimeZone(arrDate, flight.destinationTimezone || 'UTC', 'dd MMM yyyy')} <br />
                      {formatInTimeZone(arrDate, flight.destinationTimezone || 'UTC', 'HH:mm')}
                    </Text>
                  </Stack>
                </Flex>

                <Flex justify="space-between" align="flex-end">
                  <Stack gap={2}>
                    <Text size="xs" style={{ opacity: 0.8 }}>PASAJERO</Text>
                    <Text fw={700} size="md" style={{ textTransform: 'uppercase' }}>{reservation.passenger?.fullName}</Text>
                  </Stack>
                  <Stack gap={2} align="flex-end">
                    <Text size="xs" style={{ opacity: 0.8 }}>VUELO</Text>
                    <Text fw={800} size="md">{flight.flightNumber}</Text>
                  </Stack>
                </Flex>
              </Box>

              <Box style={{ position: 'relative', height: '30px', backgroundColor: primaryColor }}>
                <Box style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', backgroundColor: primaryColor }} />
                <Box style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', backgroundColor: 'white', borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }} />
                <Box style={{ position: 'absolute', bottom: '-10px', left: '-10px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#f1f3f5', zIndex: 2 }} />
                <Box style={{ position: 'absolute', bottom: '-10px', right: '-10px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#f1f3f5', zIndex: 2 }} />
              </Box>

              <Box style={{ padding: '20px 20px 30px 20px', backgroundColor: 'white' }}>
                <Flex justify="space-between" align="center" mb="lg">
                  <Stack gap={0}>
                    <Text size="xs" c="dimmed">CÓDIGO DE RESERVA</Text>
                    <Text fw={800} size="lg" style={{ color: textColor }}>{reservation.reservationCode}</Text>
                  </Stack>
                  {reservation.pnr && (
                    <Stack gap={0} align="flex-end">
                      <Text size="xs" c="dimmed">PNR</Text>
                      <Text fw={800} size="lg" style={{ color: secondaryColor }}>{reservation.pnr}</Text>
                    </Stack>
                  )}
                </Flex>
                <Divider mb="lg" />
                <Flex justify="space-between" align="center">
                  <Group gap="xs">
                    <FaSuitcase color={textColor} size={14} />
                    <Text size="xs" fw={600} style={{ color: textColor }}>{baggageText}</Text>
                  </Group>
                  <Badge color={statusInfo.color} variant="light" size="sm" leftSection={statusInfo.icon}>{statusInfo.label}</Badge>
                </Flex>
              </Box>
            </Box>
          );
        })}

        <Stack align="center" gap={4} mt="md" mb="xl">
          {reservation.company?.logoUrl && (
            <Image src={reservation.company.logoUrl} h={30} w="auto" fit="contain" alt="Logo" />
          )}
          <Text size="xs" c="dimmed" ta="center">
            Este documento es una comprobación digital en tiempo real.<br />
            © {new Date().getFullYear()} {reservation.company?.commercialName}. Todos los derechos reservados.
          </Text>
        </Stack>
      </Stack>
    </Box>
  );
}