import { Card, Group, Loader, Select, TextInput, Title } from "@mantine/core";
import { Control, Controller, FieldErrors, UseFormGetValues, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { AirportInput } from "./AirportInput";
import { AirlineType, FlightType } from "@/types/ModelsType";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState, useMemo } from "react"; // 👈 Añadimos useMemo
import { getTimezoneOffsetMs } from "./utils";
import { InlineDateTimePicker } from "./InlineDateTimePicker";

type Props = {
    isManual: boolean;
    errors: FieldErrors<FlightType>;
    control: Control<FlightType>;
    register: UseFormRegister<FlightType>;
    setValue: UseFormSetValue<FlightType>;
    getValues: UseFormGetValues<FlightType>;
    watch: UseFormWatch<FlightType>;
    onReadyCreate: (state: boolean) => void;
}

export const TabFlightManual = ({
    isManual,
    errors, control, register, setValue, getValues, watch, onReadyCreate
}: Props) => {
    const { data: session } = useSession();
    const [airlines, setAirlines] = useState<{ value: string; label: string }[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loadingAirlines, setLoadingAirlines] = useState(false);
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    const currentAirline = watch('airline');
    const airlineId = watch('airlineId');

    const flightNumber = watch('flightNumber');
    const departureTime = watch('departureTime');
    const arrivalTime = watch('arrivalTime');
    const origin = watch('origin');
    const destination = watch('destination');
    const originName = watch('originName');
    const destinationName = watch('destinationName');
    const originTimezone = watch('originTimezone');
    const destinationTimezone = watch('destinationTimezone');
    const flightClass = watch('class');
    const availableSeats = watch('availableSeats');
    const isLoadingOrigin = !originTimezone && watch("origin")?.length === 3;
    const isLoadingDestination = !destinationTimezone && watch("destination")?.length === 3;

    const loadAirlines = async (search: string) => {
        if (!session?.user) return;
        setLoadingAirlines(true);
        try {
            const params = new URLSearchParams({ page: "1", limit: "20", sortBy: "createdAt", sortOrder: "desc" });
            if (search.trim()) params.append("officialName:like", search.trim());
            const response = await fetch(`/api/system/airlines?${params.toString()}`);
            if (response.ok) {
                const result = await response.json();
                setAirlines((result.data || []).map((a: AirlineType) => ({ value: a.id!, label: `${a.displayName} (${a.iata})` })));
            }
        } catch (error) { console.error(error); }
        finally { setLoadingAirlines(false); }
    };

    useEffect(() => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => loadAirlines(searchTerm), 400);
        return () => { if (debounceTimeout.current) clearTimeout(debounceTimeout.current); };
    }, [searchTerm]);

    useEffect(() => { loadAirlines(""); }, []);

    // 👇 SOLUCIÓN: Usamos useMemo para combinar la lista de la API con la aerolínea actual sin duplicados
    const selectOptions = useMemo(() => {
        const options = [...airlines];
        if (currentAirline && currentAirline.id) {
            const exists = options.find(a => a.value === currentAirline.id);
            if (!exists) {
                options.unshift({
                    value: currentAirline.id,
                    label: `${currentAirline.displayName} (${currentAirline.iata})`
                });
            }
        }
        return options;
    }, [airlines, currentAirline]);

    useEffect(() => {
        const isValid =
            !!flightNumber &&
            !!airlineId &&
            !!departureTime &&
            !!arrivalTime &&
            !!origin && origin.length === 3 &&
            !!destination && destination.length === 3 &&
            !!originName &&
            !!destinationName &&
            !!originTimezone &&
            !!destinationTimezone &&
            !!flightClass &&
            availableSeats !== null &&
            availableSeats !== undefined &&
            availableSeats >= 0;

        onReadyCreate(isValid);
    }, [
        flightNumber, airlineId, departureTime, arrivalTime, origin, destination,
        originName, destinationName, originTimezone, destinationTimezone, flightClass, availableSeats
    ]);

    return (
        <Card withBorder radius="md" p="md">
            <Title order={4} mb="md">Datos del Vuelo</Title>

            <Controller
                name="airlineId"
                control={control}
                rules={{ required: isManual ? 'Debe seleccionar una aerolínea' : false }}
                render={({ field }) => (
                    <Select
                        label="Aerolínea"
                        placeholder="Busque por nombre o código"
                        data={selectOptions} // 👈 Usamos las opciones combinadas
                        value={field.value}
                        onChange={(val) => {
                            field.onChange(val);
                            // Opcional: Si cambias la aerolínea en el select, actualizamos el objeto para que la vista previa u otros lo reflejen
                            const selected = airlines.find(a => a.value === val);
                            if (selected) {
                                // Esto es útil por si necesitas el objeto completo en otra parte del form
                                // setValue('airline', { id: val, displayName: selected.label } as any);
                            }
                        }}
                        error={errors.airlineId?.message}
                        searchable
                        onSearchChange={setSearchTerm}
                        searchValue={searchTerm}
                        nothingFoundMessage="No se encontraron aerolíneas"
                        rightSection={loadingAirlines ? <Loader size="xs" /> : null}
                        clearable
                        required={isManual}
                    />
                )}
            />

            <TextInput
                label="Número de vuelo"
                placeholder="Ej: CM123"
                error={errors.flightNumber?.message}
                style={{ textTransform: 'uppercase' }}
                {...register('flightNumber', {
                    required: isManual ? 'El número de vuelo es obligatorio' : false,
                    pattern: { value: /^[A-Z0-9]{2,12}$/, message: 'Formato inválido' },
                    onChange: (e) => { e.target.value = e.target.value.toUpperCase(); }
                })}
            />

            <Group grow mt="md">
                <AirportInput
                    fieldName="origin"
                    label="Origen (código IATA)"
                    placeholder="Ej: PTY"
                    control={control}
                    errors={errors}
                    setValue={setValue}
                    getValues={getValues}
                    watch={watch}
                    getTimezoneOffsetMs={getTimezoneOffsetMs}
                    isManual={isManual}
                />
                <AirportInput
                    fieldName="destination"
                    label="Destino (código IATA)"
                    placeholder="Ej: MAD"
                    control={control}
                    errors={errors}
                    setValue={setValue}
                    getValues={getValues}
                    watch={watch}
                    getTimezoneOffsetMs={getTimezoneOffsetMs}
                    isManual={isManual}
                />
            </Group>

            <InlineDateTimePicker
                fieldName="departureTime"
                label="Fecha y hora de salida"
                timezone={originTimezone}
                control={control}
                errors={errors}
                getTimezoneOffsetMs={getTimezoneOffsetMs}
                disabled={isLoadingOrigin}
                isManual={isManual}
            />

            <InlineDateTimePicker
                fieldName="arrivalTime"
                label="Fecha y hora de llegada"
                timezone={destinationTimezone}
                control={control}
                errors={errors}
                getTimezoneOffsetMs={getTimezoneOffsetMs}
                disabled={isLoadingDestination}
                isManual={isManual}
            />
        </Card>
    )
}