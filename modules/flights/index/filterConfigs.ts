import { InputFilter } from '@/components/FilterChipPopover/InputFilter';
import { DateRangeFilter } from '@/components/FilterChipPopover/DateRangeFilter';

// Configuración base de cada filtro
export const filterConfigs = [
    {
        id: 'flightNumber:like', 
        label: 'Número de Vuelo',
        placeholder: 'CM215',
        component: InputFilter,
        formatActiveLabel: (val: string) => `Vuelo: ${val}`,
        closeOnChange: false,
    },
    {
        id: 'airline.displayName:like',
        label: 'Aerolinea',
        placeholder: 'Copa',
        component: InputFilter,
        formatActiveLabel: (val: string) => `Aerolinea: ${val}`,
        closeOnChange: false,
    },
    {
        id: 'origin:like',
        label: 'Origen (IATA)',
        placeholder: 'AR',
        component: InputFilter,
        formatActiveLabel: (val: string) => `IATA: ${val}`,
        closeOnChange: false,
    },
    {
        id: 'destination:like',
        label: 'Destinación (IATA)',
        placeholder: 'AR',
        component: InputFilter,
        formatActiveLabel: (val: string) => `IATA: ${val}`,
        closeOnChange: false,
    },
    {
        id: 'createdAt:between',
        label: "Rango de fechas",
        component: DateRangeFilter,
        formatActiveLabel: (val: any) => {
            const [start, end] = val;
            if (start && end) return `${start} → ${end}`;
            return '';
        },
        placeholder: "Selecciona rango de fechas",
        closeOnChange: false,         // no cierres al seleccionar fechas
        closeOnClickOutside: false,   // ← no cierres al hacer clic en el calendario (portal)
        clearable: true,
    }
];