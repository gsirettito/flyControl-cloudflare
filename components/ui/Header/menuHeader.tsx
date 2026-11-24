import {
    FiSettings,
    FiLogOut,
    FiUser,
} from 'react-icons/fi';

export const menuHeader = [
    /* {
        label: "Configuración",
        options: [
            {
                icon: <FiUser size={16} />,
                label: 'Mi perfil'
            },
            {
                icon: <FiSettings size={16} />,
                label: 'Configuración de cuenta'
            }
        ]
    }, */
    {
        label: "Sesión",
        options: [
            {
                icon: <FiLogOut size={16} />,
                label: 'Cerrar sesión',
                color: 'red'
            }
        ]
    },
];