import { Stack } from "@mantine/core"
import { DatePickerInput } from "@mantine/dates";

export const DateRangeFilter = ({
    value,
    onChange,
    placeholder,
    clearable
}: {
    value: any;
    onChange: (val: any) => void;
    placeholder?: string;
    clearable?: boolean
}) => {

    return (
        <Stack>
            <DatePickerInput
                type="range"
                numberOfColumns={2}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                clearable={clearable}
                styles={{ input: { width: 260 } }}
            />
        </Stack>
    )
}