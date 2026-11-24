import { createTheme, MantineProvider } from "@mantine/core";
import { primary, secondary } from "./color";

const theme = createTheme({
    
    // 🔥 AÑADIDO: Tipografía Premium
    fontFamily: 'var(--font-inter), sans-serif',
    headings: {
        fontFamily: 'var(--font-outfit), sans-serif',
        fontWeight: '700',
    },

    // 🔥 AÑADIDO: Bordes más suaves (Diseño moderno)
    defaultRadius: 'md',

    // Sombras sutiles para las tarjetas
    shadows: {
        sm: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
        md: '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.03)',
    },
    colors: {
        primary,
        secondary,
        brand: ['#fefce8', '#fef08a', '#fde047', '#facc15', '#eab308', '#ca8a04', '#a16207', '#854d0e', '#713f12', '#422006'],
    },
    primaryColor: 'primary',
});

export default theme