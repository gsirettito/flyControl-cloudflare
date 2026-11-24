import {
    FiHome,
    FiSettings,
    FiBriefcase,
    FiUsers,
    FiAirplay,
    FiMap,
    FiUserCheck,
    FiFileText
} from 'react-icons/fi';
import { IconType } from 'react-icons';
import { IoAirplaneOutline, IoPaperPlaneOutline } from "react-icons/io5";

export interface SubMenuItem {
    label: string;
    path: string;
    isAdmin: boolean;
}

export interface MenuItem {
    icon: IconType;
    label: string;
    subItems: SubMenuItem[];
    isAdmin: boolean;
    isSuperAdmin: boolean;
    basePath?: string;
}

export const menuItems: MenuItem[] = [
    {
        icon: FiHome,
        label: 'Inicio',
        subItems: [
            { label: 'Dashboard', path: '/home', isAdmin: false }
        ],
        isAdmin: false,
        isSuperAdmin: false,
        basePath: '/home',
    },
    {
        icon: FiMap,
        label: 'Reservación',
        subItems: [
            { label: 'Lista de reservas', path: '/reservations/list', isAdmin: false },
            { label: 'Calendario de reservas', path: '/reservations/calendar', isAdmin: false },
            { label: 'Descubre tu vuelo', path: '/reservations/discovery', isAdmin: false },
            { label: 'Reserva de vuelo', path: '/reservations', isAdmin: false },
        ],
        isAdmin: false,
        isSuperAdmin: false,
        basePath: '/reservations',
    },
    {
        icon: FiFileText,
        label: 'Facturación',
        subItems: [
            { label: 'Lista de facturas', path: '/invoices', isAdmin: false },
        ],
        isAdmin: false, // Tanto Admin como Manager pueden verlo y usarlo
        isSuperAdmin: false,
        basePath: '/invoices',
    },
    {
        icon: FiUsers,
        label: 'Personal',
        subItems: [
            { label: 'Lista de clientes', path: '/clients', isAdmin: false },
        ],
        isAdmin: false,
        isSuperAdmin: false,
        basePath: '/clients',
    },
    {
        icon: FiBriefcase,
        label: 'Compañías',
        subItems: [
            { label: 'Lista de compañías', path: '/companies', isAdmin: false },
        ],
        isAdmin: false,
        isSuperAdmin: true,
        basePath: '/companies',
    },
    {
        icon: FiAirplay,
        label: 'Aerolineas',
        subItems: [
            { label: 'Lista de aerolineas', path: '/airlines', isAdmin: false },
        ],
        isAdmin: false,
        isSuperAdmin: true,
        basePath: '/airlines',
    },
    {
        icon: IoPaperPlaneOutline,
        label: 'Vuelos',
        subItems: [
            { label: 'Lista de vuelos', path: '/flight', isAdmin: false },
        ],
        isAdmin: false,
        isSuperAdmin: false,
        basePath: '/flight',
    },
    {
        icon: FiUserCheck,
        label: 'Gestores',
        subItems: [
            { label: 'Lista de gestores', path: '/managers', isAdmin: true },
        ],
        isAdmin: true,      // Solo los Admins pueden ver la gestión de personal
        isSuperAdmin: false,
        basePath: '/managers',
    },
    {
        icon: FiSettings,
        label: 'Configuración',
        subItems: [
            { label: 'Datos de Empresa', path: '/settings/company', isAdmin: true },
            { label: 'Notificaciones', path: '/settings/notifications', isAdmin: true },
        ],
        isAdmin: true,
        isSuperAdmin: false,
        basePath: '/settings',
    },
];