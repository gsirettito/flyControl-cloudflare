import { Button } from "@mantine/core";
import React from "react";

interface Option {
    value: string;
    label: string;
}

interface RadioButtonGroupProps {
    options: Option[];
    value?: string;           // Control externo (opcional)
    defaultValue?: string;    // Valor inicial cuando no está controlado
    onChange?: (value: string) => void;
    variantSelected?: "default" | "secondary" | "outline" | "ghost" | "link" | "filled";
    variantUnselected?: "default" | "secondary" | "outline" | "ghost" | "link" | "filled";
    className?: string;
}

export function RadioButtonGroup({
    options,
    value: controlledValue,
    defaultValue,
    onChange,
    variantSelected = "filled",
    variantUnselected = "default",
    className = "",
}: RadioButtonGroupProps) {
    // Estado interno si no está controlado
    const [internalValue, setInternalValue] = React.useState(defaultValue || options[0]?.value || "");

    const selectedValue = controlledValue !== undefined ? controlledValue : internalValue;

    const handleSelect = (val: string) => {
        if (controlledValue === undefined) {
            setInternalValue(val);
        }
        onChange?.(val);
    };

    return (
        <Button.Group className={className}>
            {options.map((opt) => (
                <Button
                    key={opt.value}
                    variant={ selectedValue === opt.value ? variantSelected : variantUnselected}
                    onClick={() => handleSelect(opt.value)}
                >
                    {opt.label}
                </Button>
            ))}
        </Button.Group>
    );
}