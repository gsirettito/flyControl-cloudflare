import { InputFilter } from '@/components/FilterChipPopover/InputFilter';
import { DateRangeFilter } from '@/components/FilterChipPopover/DateRangeFilter';

// Configuración base de cada filtro
export const filterConfigs = [
    {
        id: 'commercialName:like',
        label: 'Nombre comercial',
        placeholder: 'Ej: TravelCo',
        component: InputFilter,
        formatActiveLabel: (val: string) => `Nombre comercial: ${val}`,
        closeOnChange: false,
    },
    {
        id: 'phone:like',
        label: 'Teléfono',
        placeholder: 'Ej: 123-456-7890',
        component: InputFilter,
        formatActiveLabel: (val: string) => `Teléfono: ${val}`,
        closeOnChange: false,
    },
    {
        id: 'ticketPrefix:like',
        label: 'Prefijo de ticket',
        placeholder: 'Ej: TRAVEL-',
        component: InputFilter,
        formatActiveLabel: (val: string) => `Prefijo de ticket: ${val}`,
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