import { Group, TextInput, Button } from "@mantine/core"

export const InputFilter = ({
    value,
    onChange,
    placeholder,
}: {
    value: any;
    onChange: (val: any) => void;
    placeholder?: string;
    clearable?: boolean;
}) => {

    return (
        <Group>
            <TextInput
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.currentTarget.value)}
            />
            <Button
                variant="subtle"
                size="xs"
                onClick={() => onChange('')}
                disabled={!value}
            >
                Limpiar
            </Button>
        </Group>
    )
}