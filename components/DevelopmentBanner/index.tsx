'use client';

import { Box, Marquee, Text, useMantineTheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

export function DevelopmentBanner() {
    const theme = useMantineTheme();
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

    return (
        <Marquee
            pauseOnHover
            duration={8000}
            style={{ backgroundColor: theme.colors[theme.primaryColor][6], padding: '4px 0' }}
        >
            <Box w={"200px"}/>
            <Text size={isMobile ? "xs" : "sm"} fw={500} c="white">
                Bienvenido a OTP Cuba. Desde nuestra plataforma podrá enviar códigos OTP dentro del territorio Cubano.
                Nuestra plataforma está en fase de desarrollo y seguirá aumentando sus funcionalidades.
                Comunicar con services@noxcreation.dev para obtener más información relevante.
            </Text>
            <Box w={"200px"}/>
        </Marquee>
    );
}