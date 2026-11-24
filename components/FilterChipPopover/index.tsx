'use client';

import { Flex, Popover } from '@mantine/core';
import { FiPlusCircle } from 'react-icons/fi';
import { ReactNode } from 'react';
import classes from './FilterChipPopover.module.css';   // ← importa el CSS Module

interface FilterChipPopoverProps {
    label: string;
    value: any;
    onChange: (val: any) => void;
    children: (props: {
        value: any;
        onChange: (val: any) => void;
        placeholder?: string;
        clearable?: boolean;
    }) => ReactNode;
    closeOnChange?: boolean;
    closeOnClickOutside?: boolean;
    formatActiveLabel?: (value: any) => string;
    placeholder?: string;
    clearable?: boolean;
}

export function FilterChipPopover({
    label,
    value,
    onChange,
    children,
    closeOnChange = true,
    closeOnClickOutside = true,
    formatActiveLabel,
    placeholder,
    clearable = true,
}: FilterChipPopoverProps) {

    const isActive = value !== undefined && value !== null && value !== '' &&
        (Array.isArray(value) ? value[0] !== null && value[1] !== null : true);

    const activeLabel = isActive
        ? formatActiveLabel
            ? formatActiveLabel(value)
            : `${label}: ${value}`
        : label;

    const handleChange = (newValue: any) => {
        onChange(newValue);
    };

    return (
        <Popover
            position="bottom"
            withArrow
            shadow="md"
            closeOnClickOutside={closeOnClickOutside}
            withinPortal
        >
            <Popover.Target>
                {/* No uses Flex si solo es para aplicar clases; un div o button es suficiente. Pero Flex está bien */}
                <Flex
                    className={`${classes.chip} ${isActive ? classes.chipActive : ''}`}
                >
                    <FiPlusCircle size={14} />
                    <span style={{ fontSize: '14px' }}>{activeLabel}</span>
                </Flex>
            </Popover.Target>
            <Popover.Dropdown>
                {children({
                    value,
                    onChange: handleChange,
                    placeholder,
                    clearable,
                })}
            </Popover.Dropdown>
        </Popover>
    );
}