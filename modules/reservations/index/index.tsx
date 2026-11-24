// modules/reservations/index/index.tsx
'use client';

import { useRef, useState } from 'react';
import {
    Stack, Title, Flex, Group, Button, Select, NumberInput, Checkbox,
    Grid, Divider, Alert, Radio,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { FiPlus, FiAirplay } from 'react-icons/fi';
import { FlightType, TripType, ReservationType } from '@/types/ModelsType';
import { ItemFly } from './components/ItemFly';
import { baggageOptions } from './mock';
import { ModalSearchTravel } from './components/modal/ModalSearchTravel';
import { SelectClient } from './components/SelectClient';
import { useSession } from 'next-auth/react';
import { notifications } from "@mantine/notifications";
import { useRouter } from 'next/navigation';
import { ButtonAdd, ButtonAddRef } from '@/components/ButtonAdd';
import { FormFlight } from '@/modules/flights/index/form';
import { FormClient } from '../list/form';

export const ReservationsIndex = () => {
    const clientButtonAddRef = useRef<ButtonAddRef>(null);
    const flightButtonAddRef = useRef<ButtonAddRef>(null);

    const session = useSession();
    // 🔒 FIX: Extraemos si es admin para usarlo en el renderizado
    const isAdmin = session?.data?.user?.isAdmin || false;

    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [tripType, setTripType] = useState<TripType>('ONE_WAY');
    const [departureFlights, setDepartureFlights] = useState<FlightType[]>([]);
    const [returnFlights, setReturnFlights] = useState<FlightType[]>([]);
    const [selectedPassengerId, setSelectedPassengerId] = useState<string | null>(null);
    const [baggage, setBaggage] = useState<string>(baggageOptions[0].value);
    const [addInvoice, setAddInvoice] = useState(false);
    const [invoiceAmount, setInvoiceAmount] = useState<number | null>(null);
    const [invoiceCurrency, setInvoiceCurrency] = useState<string>('USD');

    const [departureModalOpened, { open: openDepartureModal, close: closeDepartureModal }] = useDisclosure(false);
    const [returnModalOpened, { open: openReturnModal, close: closeReturnModal }] = useDisclosure(false);

    const removeDepartureFlight = (index: number) => {
        setDepartureFlights(prev => prev.filter((_, i) => i !== index));
    };

    const removeReturnFlight = (index: number) => {
        setReturnFlights(prev => prev.filter((_, i) => i !== index));
    };

    const buildReservationObject = () => {
        return {
            tripType,
            departureFlights: departureFlights.map(flight => ({ reservationId: '', flightId: flight.id, flight })),
            returnFlights: tripType === 'ROUND_TRIP' ? returnFlights.map(flight => ({ reservationId: '', flightId: flight.id, flight })) : [],
            passengerId: selectedPassengerId!,
            createdByUserId: session?.data?.user?.id || '',
            baggage,
            // 👇 NUEVA LÓGICA DE FACTURA
            createInvoice: addInvoice, // Enviamos el estado del checkbox
            invoiceAmount: addInvoice ? invoiceAmount : null,
            invoiceCurrency: addInvoice ? invoiceCurrency : null,
            status: 'PENDING',
            pnr: null,
            ticketNumber: null,
        };
    };

    const handleSubmit = async () => {
        setLoading(true)
        if (!selectedPassengerId) {
            notifications.show({
                title: 'Faltan datos',
                message: 'Debe seleccionar un pasajero',
                color: 'red',
            });
            setLoading(false);
            return;
        }
        if (departureFlights.length === 0) {
            notifications.show({
                title: 'Faltan datos',
                message: 'Debe agregar al menos un vuelo de ida',
                color: 'red',
            });
            setLoading(false);
            return;
        }

        // 🔥 NUEVA VALIDACIÓN PARA LA FACTURA
        if (addInvoice && (!invoiceAmount || invoiceAmount <= 0)) {
            notifications.show({
                title: 'Error en factura',
                message: 'Si agregas una factura, debes indicar un monto mayor a 0',
                color: 'red'
            });
            setLoading(false); return;
        }

        const reservationData = buildReservationObject();
        try {
            const response = await fetch('/api/system/reservation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reservationData),
            });
            if (response.ok) {
                const result = await response.json();
                notifications.show({
                    title: 'Reserva creada',
                    message: `Código: ${result.reservationCode}`,
                    color: 'green',
                });
                router.push("/reservations/list")
            } else {
                const error = await response.json();
                notifications.show({
                    title: 'Error',
                    message: error.error || 'Ocurrió un error al crear la reserva',
                    color: 'red',
                });
            }
        } catch (error) {
            console.error(error);
            notifications.show({
                title: 'Error',
                message: 'Ocurrió un error al crear la reserva',
                color: 'red',
            });
        }
        setLoading(false)
    };

    return (
        <Stack gap="xl">
            <Flex direction={{ base: 'column', md: 'row' }} align="center">
                <Title order={1} flex={1}>Nueva Reservación</Title>
            </Flex>

            <Flex gap={32} direction={{ base: "column", md: 'row' }}>
                <Stack flex={1}>

                    <Stack gap="md">
                        <Title order={3}>Pasajero / Equipaje</Title>
                        <Flex gap={10} align={'end'}>
                            <Stack flex={1}>
                                <SelectClient
                                    value={selectedPassengerId}
                                    onChange={setSelectedPassengerId}
                                    required
                                />
                            </Stack>
                            <ButtonAdd
                                ref={clientButtonAddRef}
                                apiUrl="/api/system/clients"
                                label={'Crear Nuevo Cliente'}
                                buttonLabel={'Crear Nuevo Cliente'}
                                form={FormClient}
                                exclude={['id', 'userId']}
                                onSuccess={async () => { }}
                                onClick={() => { }}
                                variant='light'
                            />
                        </Flex>

                        <Select
                            label="Equipaje"
                            data={baggageOptions}
                            value={baggage}
                            onChange={(val) => setBaggage(val || baggageOptions[0].value)}
                        />
                        <Checkbox
                            label="Agregar factura"
                            checked={addInvoice}
                            onChange={(e) => setAddInvoice(e.currentTarget.checked)}
                        />
                        {addInvoice && (
                            <Grid>
                                <Grid.Col span={6}>
                                    <NumberInput
                                        label="Monto"
                                        value={invoiceAmount as number}
                                        onChange={(val) => {
                                            if (val === '' || val === undefined) {
                                                setInvoiceAmount(null);
                                            } else {
                                                const num = typeof val === 'number' ? val : parseFloat(val);
                                                setInvoiceAmount(isNaN(num) ? null : num);
                                            }
                                        }}
                                        min={0}
                                        step={10}
                                        prefix="$"
                                    />
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <Select
                                        label="Moneda"
                                        data={['USD', 'EUR', 'COP', 'MXN']}
                                        value={invoiceCurrency}
                                        onChange={(val) => setInvoiceCurrency(val || 'USD')}
                                    />
                                </Grid.Col>
                            </Grid>
                        )}
                    </Stack>

                    <Button onClick={handleSubmit} size="sm" fullWidth mt="md" loading={loading}
                        disabled={departureFlights.length === 0 || !selectedPassengerId}
                    >
                        Crear reserva
                    </Button>

                </Stack>

                <Stack flex={1}>
                    <Flex>
                        <Title order={3} flex={1}>Datos del viaje</Title>

                        {/* 🔒 FIX: Ocultamos el botón de crear vuelo si no es administrador */}
                        {isAdmin && (
                            <ButtonAdd
                                ref={flightButtonAddRef}
                                apiUrl="/api/system/flights"
                                label={'Crear Nuevo Vuelo'}
                                buttonLabel={'Crear Nuevo Vuelo'}
                                form={FormFlight}
                                model="company"
                                exclude={['id', 'userId', 'apiKey']}
                                onSuccess={async () => { }}
                                onClick={() => { }}
                                variant='light'
                            />
                        )}
                    </Flex>
                    <Radio.Group
                        value={tripType}
                        onChange={(val) => setTripType(val as TripType)}
                        label="Tipo de viaje"
                        withAsterisk
                    >
                        <Group mt="xs">
                            <Radio value="ONE_WAY" label="Solo ida" />
                            <Radio value="ROUND_TRIP" label="Ida y vuelta" />
                        </Group>
                    </Radio.Group>

                    <Divider label="Itinerario de ida" labelPosition="center" />

                    {departureFlights.length === 0 ? (
                        <Alert color="primary" title="Sin vuelos de ida" icon={<FiAirplay size={16} />}>
                            No has agregado ningún vuelo de ida. Presiona el botón para agregar.
                        </Alert>
                    ) : (
                        <Stack gap={0}>
                            {departureFlights.map((flight, idx) => (
                                <ItemFly
                                    key={idx}
                                    flight={flight}
                                    removeDepartureFlight={() => removeDepartureFlight(idx)}
                                />
                            ))}
                        </Stack>
                    )}
                    <Button leftSection={<FiPlus size={16} />} onClick={openDepartureModal} variant="light">
                        Agregar vuelo de ida
                    </Button>

                    {tripType === 'ROUND_TRIP' && (
                        <>
                            <Divider label="Itinerario de regreso" labelPosition="center" />
                            {returnFlights.length === 0 ? (
                                <Alert color="primary" title="Sin vuelos de regreso" icon={<FiAirplay size={16} />}>
                                    Agrega vuelos para el regreso.
                                </Alert>
                            ) : (
                                <Stack gap={0}>
                                    {returnFlights.map((flight, idx) => (
                                        <ItemFly
                                            key={idx}
                                            flight={flight}
                                            removeDepartureFlight={() => removeReturnFlight(idx)}
                                        />
                                    ))}
                                </Stack>
                            )}
                            <Button leftSection={<FiPlus size={16} />} onClick={openReturnModal} variant="light">
                                Agregar vuelo de regreso
                            </Button>
                        </>
                    )}
                </Stack>
            </Flex>

            {/* Modales */}
            {departureModalOpened && <ModalSearchTravel
                type={'ONE_WAY'}
                opened={departureModalOpened}
                onClose={closeDepartureModal}
                flights={departureFlights}
                onChange={(flights) => setDepartureFlights(flights)}
            />}

            {returnModalOpened && <ModalSearchTravel
                type={'ROUND_TRIP'}
                opened={returnModalOpened}
                onClose={closeReturnModal}
                flights={returnFlights}
                onChange={(flights) => setReturnFlights(flights)}
            />}

        </Stack>
    );
};