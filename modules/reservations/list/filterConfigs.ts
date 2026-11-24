import { InputFilter } from '@/components/FilterChipPopover/InputFilter';
import { DateRangeFilter } from '@/components/FilterChipPopover/DateRangeFilter';
import { SelectFilter } from '@/components/FilterChipPopover/SelectFilter';

// Configuración base de cada filtro
export const filterConfigs = [
    {
        id: 'reservationCode:like',
        label: 'Código de reserva',
        placeholder: 'YUO*****',
        component: InputFilter,
        formatActiveLabel: (val: string) => `Código: ${val}`,
        closeOnChange: false,
    },
    {
        id: 'passenger.fullName:like',
        label: 'Nombre Pasajero',
        placeholder: 'Ej: pedro',
        component: InputFilter,
        formatActiveLabel: (val: string) => `Nombre: ${val}`,
        closeOnChange: false,
    },
    {
        id: 'createdBy.name:like',
        label: 'Nombre Creador',
        placeholder: 'Ej: pedro',
        component: InputFilter,
        formatActiveLabel: (val: string) => `Nombre: ${val}`,
        closeOnChange: false,
    },
    {
        id: 'ticketNumber:like',
        label: 'Número del Ticket',
        placeholder: 'TH****',
        component: InputFilter,
        formatActiveLabel: (val: string) => `Ticket: ${val}`,
        closeOnChange: false,
    },
    {
        id: 'pnr:like',
        label: 'Número del PNR',
        placeholder: 'PN****',
        component: InputFilter,
        formatActiveLabel: (val: string) => `PNR: ${val}`,
        closeOnChange: false,
    },
    {
        id: 'status',
        label: 'Estado',
        placeholder: 'Pending',
        component: SelectFilter,
        componentProps: {
            data: [
                { label: "PRERESERVA", value: 'PENDING' },
                { label: "RECHAZADO", value: 'REJECTED' },
                { label: "CONFIRMADO", value: 'CONFIRMED' }
            ]
        },
        formatActiveLabel: (val: string) => `Estado: ${val}`,
        closeOnChange: false,
    },
    {
        id: 'tripType',
        label: 'Tipo de Envio',
        placeholder: 'Solo Ida',
        component: SelectFilter,
        componentProps: {
            data: [
                { label: "Solo Ida", value: 'ONE_WAY' },
                { label: "Ida y Vuelta", value: 'ROUND_TRIP' }
            ]
        },
        formatActiveLabel: (val: string) => `Estado: ${val}`,
        closeOnChange: false,
    },
    {
        id: 'createdAt:between',
        label: "Rango de Fecha",
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