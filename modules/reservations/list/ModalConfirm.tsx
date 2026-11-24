'use client';

import { useState } from 'react';
import { primary } from "@/components/ui/Theme/color";
import { ReservationType } from "@/types/ModelsType";
import { Button, Flex, Group, Input, Modal, Stack, Text, Alert, Tooltip } from "@mantine/core";
import { notifications } from '@mantine/notifications';
import { FaPlane } from "react-icons/fa";

export const ModalConfirm = ({
    reservation,
    opened,
    close,
    onConfirmSuccess,
}: {
    reservation: ReservationType;
    opened: boolean;
    close: () => void;
    onConfirmSuccess?: () => void;
}) => {
    const [pnr, setPnr] = useState(reservation.pnr || '');
    const [ticketNumber, setTicketNumber] = useState(reservation.ticketNumber || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async () => {
        if (!pnr.trim()) {
            setError('El campo PNR es obligatorio');
            return;
        }
        if (!ticketNumber.trim()) {
            setError('El campo número de ticket es obligatorio');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/system/reservation/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reservationId: reservation.id,
                    pnr: pnr.trim(),
                    ticketNumber: ticketNumber.trim(),
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Error al confirmar la reserva');
            }
            notifications.show({
                title: 'Éxito',
                message: `Reserva ${reservation.reservationCode} confirmada correctamente`,
                color: 'green',
            });
            close();
            if (onConfirmSuccess) onConfirmSuccess();
        } catch (err: any) {
            setError(err.message);
            notifications.show({
                title: 'Error',
                message: err.message,
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

    const departureFlights = reservation.departureFlights?.map(f => f.flight) || [];
    const origin = departureFlights[0]?.origin || '?';
    const destination = departureFlights[departureFlights.length - 1]?.destination || '?';

    return (
        <Modal opened={opened} onClose={close} title="Confirmación de reserva" centered>
            <Flex align="center" wrap="wrap" gap="md">
                <Flex align="center" gap={4} flex={1}>
                    <Tooltip label={departureFlights[0]?.originName}>
                        <Text style={{ fontSize: '18px', fontWeight: 700, color: primary[5] }}>
                            {origin}
                        </Text>
                    </Tooltip>
                    <FaPlane color={primary[5]} />
                    <Tooltip label={departureFlights[departureFlights.length - 1]?.destinationName}>
                        <Text style={{ fontSize: '18px', fontWeight: 700, color: primary[5] }}>
                            {destination}
                        </Text>
                    </Tooltip>
                </Flex>
                <Stack gap={0}>
                    <Text style={{ fontSize: '10px', fontWeight: 500, color: primary[8] }}>
                        {reservation.passenger?.fullName}
                    </Text>
                    <Text style={{ fontSize: '10px', fontWeight: 300, color: primary[8] }}>
                        {reservation.passenger?.email}
                    </Text>
                </Stack>
            </Flex>

            <Text style={{ fontSize: '14px', marginTop: "12px" }}>
                ¿Estás seguro que deseas confirmar la reserva <b>{reservation.reservationCode}</b>?
            </Text>

            {error && (
                <Alert color="red" mt="md" onClose={() => setError(null)} withCloseButton>
                    {error}
                </Alert>
            )}

            <Stack mt="md">
                <Flex align="center" gap={12}>
                    <Text flex={1} style={{ fontSize: '14px', fontWeight: 600 }}>
                        PNR:
                    </Text>
                    <Input flex={3} value={pnr} onChange={(e) => setPnr(e.currentTarget.value)} placeholder="Ingrese PNR" />
                </Flex>
                <Flex align="center" gap={12}>
                    <Text flex={1} style={{ fontSize: '14px', fontWeight: 600 }}>
                        Ticket:
                    </Text>
                    <Input flex={3} value={ticketNumber} onChange={(e) => setTicketNumber(e.currentTarget.value)} placeholder="Número de ticket" />
                </Flex>
            </Stack>

            <Group mt="lg" justify="flex-end">
                <Button onClick={close} variant="default" disabled={loading}>
                    Cancelar
                </Button>
                <Button onClick={handleConfirm} color="green" loading={loading}>
                    Confirmar
                </Button>
            </Group>
        </Modal>
    );
};