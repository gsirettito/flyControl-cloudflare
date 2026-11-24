'use client';

import { DataTable, DataTableRef } from '@/components/DataTable';
import { Flex, Stack, Title, Text } from '@mantine/core';
import { getColumns } from './columns';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { filterConfigs } from './filterConfigs';
import { BarFilter } from '@/components/DataTable/components/BarFilter';
import { ButtonAdd, ButtonAddRef } from '@/components/ButtonAdd';
import { FormFlight } from './form';
import { FlightType } from '@/types/ModelsType';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import { DrawerPassenger } from './DrawerPassenger';
import { FlightDetailsDrawer } from './components/FlightDetailsDrawer';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react'; // 🔒 FIX: Importamos useSession

dayjs.extend(utc);

export const FlightsIndex = () => {
    const router = useRouter()
    const searchParams = useSearchParams();
    const { data: session } = useSession(); // 🔒 FIX: Obtenemos la sesión

    // 🔒 FIX: Verificamos si es admin
    const isAdmin = session?.user?.isAdmin || false;

    const [opened, { open, close }] = useDisclosure(false);
    const buttonAddRef = useRef<ButtonAddRef>(null);
    const tableRef = useRef<DataTableRef>(null);
    const [select, setSelect] = useState(undefined as undefined | FlightType)
    const [selectedFlight, setSelectedFlight] = useState<FlightType | null>(null);
    const [detailsOpened, setDetailsOpened] = useState(false);

    useEffect(() => {
        if (searchParams.get('action') === 'create' && isAdmin) { // 🔒 FIX: Solo si es admin
            buttonAddRef.current?.showCreate();
            window.history.replaceState(null, '', '/flight');
            setEdit(false);
        }
    }, [searchParams, isAdmin]);

    const handleEdit = (flight: FlightType) => {
        // 🔒 FIX: Doble validación de seguridad por si acaso
        if (!isAdmin) return;

        const {
            id, flightNumber, airlineId, departureTime, arrivalTime, origin, destination,
            class: flightClass, availableSeats, airline, originName, destinationName,
            originTimezone, destinationTimezone
        } = flight

        buttonAddRef.current?.showEdit({
            id, flightNumber, airlineId, departureTime, arrivalTime, origin, destination,
            class: flightClass, availableSeats, airline, originName, destinationName,
            originTimezone, destinationTimezone
        })
        setEdit(true)
    }

    const handleDelete = (flight: FlightType) => {
        // 🔒 FIX: Doble validación de seguridad
        if (!isAdmin) return;

        modals.openConfirmModal({
            title: 'Confirmar eliminación',
            children: (
                <Text size="sm">
                    ¿Estás seguro de que deseas eliminar la empresa: <strong>{flight.origin}</strong>?
                    Esta acción no se puede deshacer.
                </Text>
            ),
            labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
            confirmProps: { color: 'red' },
            centered: true,
            onConfirm: async () => {
                try {
                    const url = new URL(`/api/system/flights`, window.location.origin);
                    const res = await fetch(url.toString(), {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: flight.id }),
                    });
                    const result = await res.json();
                    if (!res.ok) throw new Error(result.error || result.message || 'Error al eliminar');
                    notifications.show({
                        title: 'Éxito',
                        message: 'Aerolinea eliminada correctamente',
                        color: 'green',
                    });
                    await tableRef.current?.refresh() as any
                } catch (error: any) {
                    notifications.show({
                        title: 'Error',
                        message: error.message || 'Ocurrió un error inesperado',
                        color: 'red',
                    });
                }
            },
        });
    }

    const handShowPassenger = async (flight: FlightType) => {
        setSelect(flight)
        open()
    }

    const handViewDetails = async (flight: FlightType) => {
        setSelectedFlight(flight);
        setDetailsOpened(true);
    }

    // 🔒 FIX: Le pasamos isAdmin a getColumns
    const columns = getColumns(isAdmin, handleEdit, handleDelete, handShowPassenger, handViewDetails);

    const [isEdit, setEdit] = useState(false)

    return (
        <Stack>
            <Flex>
                <Title flex={1} order={1}>Listado de vuelos</Title>

                {/* 🔒 FIX: Solo renderizamos el botón de agregar si es Admin */}
                {isAdmin && (
                    <ButtonAdd
                        ref={buttonAddRef}
                        apiUrl="/api/system/flights"
                        label={isEdit ? 'Editar Vuelo' : 'Crear Nuevo Vuelo'}
                        buttonLabel={'Crear Nuevo Vuelo'}
                        form={FormFlight}
                        model="company"
                        exclude={['id', 'userId', 'apiKey', 'airlineId', 'airline']}
                        defaultValues={{
                            class: "ECONOMY"
                        }}
                        onSuccess={async () => {
                            await tableRef.current?.refresh() as any
                        }}
                        onClick={() => setEdit(false)}
                    />
                )}
            </Flex>
            <DataTable
                ref={tableRef}
                apiUrl="/api/system/flights"
                columns={columns}
                initialParams={{
                    limit: 10,
                    sortBy: 'createdAt',
                    sortOrder: 'desc'
                }}
                enableGlobalFilter={false}
                renderFilters={(filters, setColumnFilter) => BarFilter({ filterConfigs, filters, setColumnFilter })}
                enableColumnOrdering={true}
                excludeFromColumnOrdering={['select', 'actions']}
                columnOrderStorageKey="column_flights"
            />

            {opened && <DrawerPassenger
                flight={select as FlightType}
                opened={opened}
                close={close}
            />}

            <FlightDetailsDrawer
                opened={detailsOpened}
                onClose={() => setDetailsOpened(false)}
                flight={selectedFlight}
            />
        </Stack>
    );
};