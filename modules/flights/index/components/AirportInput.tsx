import { Controller, Control, FieldErrors, UseFormGetValues, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Stack, Loader, Text, Skeleton, Autocomplete } from '@mantine/core';
import { FlightType } from '@/types/ModelsType';
import { useState, useEffect, useRef } from 'react';

interface AirportInputProps {
    fieldName: 'origin' | 'destination';
    label: string;
    placeholder: string;
    control: Control<FlightType>;
    errors: FieldErrors<FlightType>;
    isManual: boolean;
    setValue: UseFormSetValue<FlightType>;
    getValues: UseFormGetValues<FlightType>;
    watch: UseFormWatch<FlightType>;
    getTimezoneOffsetMs: (timezone: string, date: Date) => number;
}

export const AirportInput = ({
    fieldName, label, placeholder, control, errors, isManual, setValue, getValues, watch, getTimezoneOffsetMs
}: AirportInputProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<{ value: string; label: string }[]>([]);

    const iataValue = watch(fieldName);
    const timezoneName = watch(`${fieldName}Timezone`);
    const airportName = watch(`${fieldName}Name`);

    const timezoneRef = useRef<string | null>(getValues(`${fieldName}Timezone`) || null);

    useEffect(() => {
        const q = iataValue || '';
        if (q.length < 1) { setSuggestions([]); return; }
        const timeout = setTimeout(() => {
            fetch(`/api/system/airport-info?q=${q}`)
                .then(res => res.ok ? res.json() : [])
                .then(data => setSuggestions(data))
                .catch(() => { });
        }, 300);
        return () => clearTimeout(timeout);
    }, [iataValue]);

    useEffect(() => {
        const iata = iataValue?.toUpperCase();
        const controller = new AbortController();

        if (!iata || iata.length !== 3) {
            setValue(`${fieldName}Timezone`, null as any);
            setValue(`${fieldName}Name`, null as any);
            timezoneRef.current = null;
            return;
        }

        const existingTz = getValues(`${fieldName}Timezone`);
        if (existingTz) {
            timezoneRef.current = existingTz;
            return;
        }

        setIsLoading(true);
        fetch(`/api/system/airport-info?iata=${iata}`, { signal: controller.signal })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data && data.timezone) {
                    const newTimezone = data.timezone;
                    const oldTimezone = timezoneRef.current;

                    const timeField = fieldName === 'origin' ? 'departureTime' : 'arrivalTime';
                    const currentTimeStr = getValues(timeField as any);

                    if (currentTimeStr && oldTimezone !== newTimezone) {
                        const currentUtc = new Date(currentTimeStr);
                        const oldOffsetMs = oldTimezone ? getTimezoneOffsetMs(oldTimezone, currentUtc) : 0;
                        const displayTime = new Date(currentUtc.getTime() + oldOffsetMs);
                        const newOffsetMs = getTimezoneOffsetMs(newTimezone, displayTime);
                        const newUtc = new Date(displayTime.getTime() - newOffsetMs);
                        setValue(timeField as any, newUtc.toISOString() as any);
                    }

                    timezoneRef.current = newTimezone;
                    setValue(`${fieldName}Timezone`, newTimezone as any);
                    setValue(`${fieldName}Name`, data.name as any);
                } else {
                    setValue(`${fieldName}Timezone`, null as any);
                    setValue(`${fieldName}Name`, null as any);
                    timezoneRef.current = null;
                }
            })
            .catch(err => {
                if (err.name !== 'AbortError') {
                    console.error(err);
                    setValue(`${fieldName}Timezone`, null as any);
                    setValue(`${fieldName}Name`, null as any);
                    timezoneRef.current = null;
                }
            })
            .finally(() => { if (!controller.signal.aborted) setIsLoading(false); });

        return () => controller.abort();
    }, [iataValue, setValue, getValues, fieldName]);

    return (
        <Stack gap={0}>
            <Controller
                name={fieldName}
                control={control}
                rules={{ required: isManual ? `${label} es obligatorio` : false, pattern: /^[A-Za-z]{3}$/ }}
                render={({ field }) => (
                    <Autocomplete
                        label={label}
                        placeholder={placeholder}
                        data={suggestions}
                        value={field.value || ''}
                        onChange={(val) => {
                            const code = val.length > 3 ? val.substring(0, 3).toUpperCase() : val.toUpperCase();
                            if (code !== field.value) {
                                setValue(`${fieldName}Timezone`, null as any);
                                setValue(`${fieldName}Name`, null as any);
                            }
                            field.onChange(code);
                        }}
                        error={errors[fieldName as keyof FlightType]?.message as string}
                        style={{ textTransform: 'uppercase' }}
                        rightSection={isLoading ? <Loader size="xs" /> : null}
                    />
                )}
            />
            {isLoading ? (
                <Stack gap={4} mt={6}>
                    <Skeleton height={8} width="80%" radius="xl" />
                    <Skeleton height={8} width="50%" radius="xl" />
                </Stack>
            ) : timezoneName ? (
                <Stack gap={0} mt={6}>
                    <Text size="xs" c="dimmed">{airportName}</Text>
                    <Text size="xs" c="dimmed">Zona Horaria: {timezoneName}</Text>
                </Stack>
            ) : (
                <Text size="xs" c="dimmed" mt={6}>Escriba un código IATA válido</Text>
            )}
        </Stack>
    );
};