// BooleanFilter.tsx
import { Button, Group, Switch } from "@mantine/core";

export const BooleanFilter = ({
    value,
    onChange,
}: {
    value: any;
    onChange: (val: any) => void;
}) => {
    // value puede venir como string "true"/"false" o booleano
    const isChecked = value === true || value === 'true';
    return (
        <Group>
            <Switch
                checked={isChecked}
                onChange={(e) => onChange(!isChecked)}
            />

            <Button
                variant="subtle"
                size="xs"
                onClick={() => onChange('')}
                disabled={value === ''}
            >
                Limpiar
            </Button>
        </Group>
    );
};