'use client';

import { useState, useEffect } from 'react';
import { Text } from '@mantine/core';

interface CountdownTimerProps {
    createdAt: string | Date;       // Fecha de creación de la reserva
    expiryHours: number;           // Horas hasta expiración (de Company)
}

export const CountdownTimer = ({ createdAt, expiryHours }: CountdownTimerProps) => {
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        // Calcular la fecha de expiración = createdAt + expiryHours horas
        const created = new Date(createdAt);
        const expiry = new Date(created.getTime() + expiryHours * 60 * 60 * 1000);

        const updateTimer = () => {
            const now = new Date();
            const diff = expiry.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft('Expirada');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (3600000)) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            const parts = [];
            if (hours > 0) parts.push(`${hours}h`);
            if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
            parts.push(`${seconds}s`);
            setTimeLeft(parts.join(' '));
        };

        updateTimer(); // ejecutar inmediatamente
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [createdAt, expiryHours]);

    return (
        <Text size="xs" c={timeLeft === 'Expirada' ? 'red' : 'orange'}>
            {timeLeft === 'Expirada' ? 'Eliminar en: Expirada' : `Eliminar en: ${timeLeft}`}
        </Text>
    );
};