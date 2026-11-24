'use client';

import { useEffect, useState } from 'react';
import { Box, Button } from '@mantine/core';
import { FaWhatsapp } from 'react-icons/fa';
import { FiArrowUp } from 'react-icons/fi';
import { primary } from '@/components/ui/Theme/color'; // Ajusta la ruta según tu proyecto

export const ButtonUp = () => {
    const [showTopButton, setShowTopButton] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShowTopButton(window.scrollY > 0);
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
            {/* Botón fijo de WhatsApp */}
            <Box
                style={{
                    position: 'fixed',
                    bottom: 20,
                    right: '5%',
                    zIndex: 80,
                }}
            >
                <Button
                    component="a"
                    href="https://api.whatsapp.com/send/?phone=+5358477311&text=Hola%20estoy%20interesado%20en%20sus%20servicios.&type=phone_number&app_absent=0"
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="filled"
                    color="green"
                    radius="xl"
                    w={50}
                    h={50}
                    p={0}
                    style={{
                        boxShadow: '0 0 70px #23964c',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <FaWhatsapp size={24} />
                </Button>
            </Box>

            {/* Botón para subir al inicio (usa el color primary del sistema) */}
            {showTopButton && (
                <Box
                    style={{
                        position: 'fixed',
                        bottom: 90,
                        right: '5%',
                        zIndex: 80,
                        animation: 'fadeIn 300ms ease-out',
                    }}
                >
                    <Button
                        onClick={scrollToTop}
                        variant="filled"
                        radius="xl"
                        w={50}
                        h={50}
                        p={0}
                        style={{
                            backgroundColor: primary[6],          // Color principal del tema
                            boxShadow: `0 0 70px ${primary[6]}`,  // Sombra del mismo color
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = primary[7];
                            e.currentTarget.style.boxShadow = `0 0 70px ${primary[7]}`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = primary[6];
                            e.currentTarget.style.boxShadow = `0 0 70px ${primary[6]}`;
                        }}
                    >
                        <FiArrowUp size={24} style={{ color: 'white' }} />
                    </Button>
                </Box>
            )}

            {/* Animación fadeIn (opcional) */}
            <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
        </>
    );
};