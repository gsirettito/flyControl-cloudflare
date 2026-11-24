import { Group, NumberInput, Button } from '@mantine/core';

interface NumberRangeFilterProps {
    value: string;          // formato "min,max" (ej. "18,65")
    onChange: (val: string) => void;
    placeholder?: string;
    clearable?: boolean;
    min?: number;
    max?: number;
}

export const NumberRangeFilter = ({
    value,
    onChange,
    placeholder,
    clearable,
    min = 0,
    max = 120,
}: NumberRangeFilterProps) => {
    // Extraer valores actuales (pueden estar vacíos)
    const [minVal, maxVal] = value
        ? value.split(',').map(v => (v === '' ? undefined : Number(v)))
        : [undefined, undefined];

    const handleMinChange = (val: any) => {
        const newMin = val ?? '';
        const newMax = maxVal ?? '';
        if (newMin !== '' || newMax !== '') {
            onChange(`${newMin},${newMax}`);
        } else {
            onChange('');
        }
    };

    const handleMaxChange = (val: any) => {
        const newMin = minVal ?? '';
        const newMax = val ?? '';
        if (newMin !== '' || newMax !== '') {
            onChange(`${newMin},${newMax}`);
        } else {
            onChange('');
        }
    };

    const handleClear = () => {
        onChange('');
    };

    return (
        <Group align="flex-end">
            <NumberInput
                placeholder="Mín"
                value={minVal}
                onChange={handleMinChange}
                min={min}
                max={max}
                style={{ width: 100 }}
            />
            <NumberInput
                placeholder="Máx"
                value={maxVal}
                onChange={handleMaxChange}
                min={min}
                max={max}
                style={{ width: 100 }}
            />
            {clearable && (
                <Button variant="subtle" size="xs" onClick={handleClear} disabled={!value}>
                    Limpiar
                </Button>
            )}
        </Group>
    );
};