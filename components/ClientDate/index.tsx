// components/ClientDate.tsx
'use client';
import { useState, useEffect } from 'react';

export function ClientDate({ date }: { date: Date }) {
    const [formatted, setFormatted] = useState('');
    useEffect(() => {
        setFormatted(date.toLocaleString());
    }, [date]);
    return <>{formatted || '...'}</>;
}