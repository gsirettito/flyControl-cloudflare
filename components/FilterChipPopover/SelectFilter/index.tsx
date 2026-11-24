import { Stack, Select, ComboboxData } from "@mantine/core"

export const SelectFilter = ({
    value,
    onChange,
    placeholder,
    clearable,
    data
}: {
    value: any;
    onChange: (val: any) => void;
    placeholder?: string;
    clearable?: boolean;
    data: ComboboxData<any> | undefined
}) => {

    return (
        <Stack>
            <Select
                placeholder={placeholder}
                data={data}
                value={value}
                onChange={onChange}
                clearable={clearable}
            />
        </Stack>
    )
}