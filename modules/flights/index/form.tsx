import { FlightType } from "@/types/ModelsType";
import { Button, Stack, Select, NumberInput, Group, Tabs } from "@mantine/core";
import { useState, useEffect } from "react";
import { Control, Controller, FieldErrors, UseFormGetValues, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { TabFlightManual } from "./components/TabFlightManual";
import { TabFlightAutomatic } from "./components/TabFlightAutomatic";

type Props = {
    label: string;
    errors: FieldErrors<FlightType>;
    control: Control<FlightType>;
    register: UseFormRegister<FlightType>;
    setValue: UseFormSetValue<FlightType>;
    getValues: UseFormGetValues<FlightType>;
    watch: UseFormWatch<FlightType>;
};

export const FormFlight = ({
    label, errors, control, register, setValue, getValues, watch,
}: Props) => {

    const [isReadyCreate, setIsReadyCreate] = useState(false)
    const [activeTab, setActiveTab] = useState<string | null>('auto');

    // 👇 Lógica para forzar la pestaña manual al editar
    const flightId = watch('id');
    useEffect(() => {
        if (flightId) {
            setActiveTab('manual');
        }
    }, [flightId]);

    const isManual = activeTab === 'manual';

    const classOptions = [
        { value: 'ECONOMY', label: 'Económica' },
        { value: 'BUSINESS', label: 'Business' },
        { value: 'FIRST', label: 'Primera Clase' },
    ];

    return (
        <Stack gap="md">
            <Tabs value={activeTab} onChange={setActiveTab} variant="pills" radius="md" keepMounted>
                <Tabs.List grow>
                    {/* Si estamos editando, podríamos incluso ocultar la pestaña Auto */}
                    {!flightId && <Tabs.Tab value="auto">Búsqueda Automática</Tabs.Tab>}
                    <Tabs.Tab value="manual">Creación Manual</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="auto" pt="md">
                    {activeTab == 'auto' && (
                        <TabFlightAutomatic setValue={setValue} onReadyCreate={setIsReadyCreate} />
                    )}
                </Tabs.Panel>

                <Tabs.Panel value="manual" pt="md">
                    {activeTab == 'manual' && (
                        <TabFlightManual
                            isManual={isManual}
                            errors={errors}
                            control={control}
                            register={register}
                            setValue={setValue}
                            getValues={getValues}
                            watch={watch}
                            onReadyCreate={setIsReadyCreate}
                        />
                    )}
                </Tabs.Panel>
            </Tabs>

            <Group grow mt="md">
                <Controller
                    name="class"
                    control={control}
                    rules={{ required: 'Debe seleccionar una clase' }}
                    render={({ field }) => (
                        <Select label="Clase" placeholder="Seleccione clase" data={classOptions} value={field.value} onChange={field.onChange} error={errors.class?.message} required />
                    )}
                />
                <Controller
                    name="availableSeats"
                    control={control}
                    rules={{ required: 'Los asientos disponibles son obligatorios', min: { value: 0, message: 'No puede ser negativo' } }}
                    render={({ field }) => (
                        <NumberInput label="Asientos disponibles" placeholder="Cantidad" min={0} value={field.value} onChange={(val) => field.onChange(val || 0)} error={errors.availableSeats?.message} required />
                    )}
                />
            </Group>

            <Button type="submit" mt="md" disabled={!isReadyCreate}>
                {label}
            </Button>
        </Stack>
    );
};