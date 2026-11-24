import { Controller, Control, FieldErrors } from 'react-hook-form';
import { DatePicker, TimePicker } from '@mantine/dates';
import { Text as MantineText, Stack } from '@mantine/core';
import { FlightType } from '@/types/ModelsType';

interface InlineDateTimePickerProps {
    fieldName: 'departureTime' | 'arrivalTime';
    label: string;
    timezone: string | null | undefined;
    control: Control<FlightType>;
    errors: FieldErrors<FlightType>;
    getTimezoneOffsetMs: (timezone: string, date: Date) => number;
    disabled?: boolean;
    isManual: boolean;
}

export const InlineDateTimePicker = ({
    fieldName, label, timezone, control, errors, isManual, getTimezoneOffsetMs, disabled
}: InlineDateTimePickerProps) => {
    return (
        <Controller
            name={fieldName}
            control={control}
            rules={{ required: isManual ? `${label} es obligatoria` : false }}
            render={({ field }) => {
                const offsetMs = timezone && field.value
                    ? getTimezoneOffsetMs(timezone, new Date(field.value))
                    : 0;
                const displayValue = field.value
                    ? new Date(new Date(field.value).getTime() + offsetMs)
                    : null;

                const handleDateChange = (dateStr: string | null) => {
                    if (!dateStr) { field.onChange(null); return; }
                    const datePart = dateStr.split('T')[0];
                    const [year, month, day] = datePart.split('-').map(Number);
                    const newDate = new Date(year, month - 1, day);
                    if (displayValue) {
                        newDate.setHours(displayValue.getHours());
                        newDate.setMinutes(displayValue.getMinutes());
                    }
                    const currentOffsetMs = timezone ? getTimezoneOffsetMs(timezone, newDate) : 0;
                    const revertedDate = new Date(newDate.getTime() - currentOffsetMs);
                    field.onChange(revertedDate.toISOString());
                };

                const handleTimeChange = (time: string | null) => {
                    if (!time) return;
                    const [hours, minutes] = time.split(':').map(Number);
                    const newDate = displayValue ? new Date(displayValue) : new Date();
                    newDate.setHours(hours || 0);
                    newDate.setMinutes(minutes || 0);
                    const currentOffsetMs = timezone ? getTimezoneOffsetMs(timezone, newDate) : 0;
                    const revertedDate = new Date(newDate.getTime() - currentOffsetMs);
                    field.onChange(revertedDate.toISOString());
                };

                const timeStr = displayValue
                    ? `${String(displayValue.getHours()).padStart(2, '0')}:${String(displayValue.getMinutes()).padStart(2, '0')}`
                    : '';

                return (
                    <Stack gap="xs" mt="md">
                        <MantineText size="sm" fw={500}>{label} <MantineText span c="red" size="sm">*</MantineText></MantineText>
                        <Stack align="center" gap="md" style={{ border: '1px solid var(--mantine-color-gray-4)', borderRadius: 8, padding: 12 }}>
                            <DatePicker
                                value={displayValue}
                                onChange={handleDateChange as any}
                                withCellSpacing={false}
                            />
                            <TimePicker
                                value={timeStr}
                                onChange={handleTimeChange}
                                disabled={disabled || !timezone}
                                style={{ width: '100%' }}
                            />
                        </Stack>
                        {errors[fieldName]?.message && <MantineText size="xs" c="red">{errors[fieldName]?.message}</MantineText>}
                    </Stack>
                );
            }}
        />
    );
};