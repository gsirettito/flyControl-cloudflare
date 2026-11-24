import { InputFilter } from '@/components/FilterChipPopover/InputFilter';
import { DateRangeFilter } from '@/components/FilterChipPopover/DateRangeFilter';

// Configuración base de cada filtro
export const filterConfigs = [
    {
        id: 'name:like',
        label: 'Nombre de usuario',
        placeholder: 'Ej: Pedro',
        component: InputFilter,
        formatActiveLabel: (val: string) => `Nombre: ${val}`,
        closeOnChange: false,
    },
    {
        id: 'email:like',
        label: 'Correo',
        placeholder: 'Ej: pedro@',
        component: InputFilter,
        formatActiveLabel: (val: string) => `Correo: ${val}`,
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