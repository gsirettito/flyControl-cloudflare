import { InputFilter } from '@/components/FilterChipPopover/InputFilter';
import { DateRangeFilter } from '@/components/FilterChipPopover/DateRangeFilter';

// Configuración base de cada filtro
export const filterConfigs = [
    {
        id: 'officialName:like', 
        label: 'Nombre ofical',
        placeholder: 'Copa Airlines',
        component: InputFilter,
        formatActiveLabel: (val: string) => `Nombre oficial: ${val}`,
        closeOnChange: false,
    },
    {
        id: 'iata:like',
        label: 'IATA',
        placeholder: 'AR',
        component: InputFilter,
        formatActiveLabel: (val: string) => `IATA: ${val}`,
        closeOnChange: false,
    },
    {
        id: 'icao:like',
        label: 'ICAO',
        placeholder: 'ADR',
        component: InputFilter,
        formatActiveLabel: (val: string) => `ICAO: ${val}`,
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