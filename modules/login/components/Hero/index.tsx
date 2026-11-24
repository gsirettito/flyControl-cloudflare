// modules/login/components/Hero.tsx
'use client';

import { primary } from "@/components/ui/Theme/color";
import { Box, rem, Container, SimpleGrid, Stack, Badge, Title, Group, Button, Avatar, Text, ThemeIcon } from "@mantine/core";
import { FcGoogle } from "react-icons/fc";
import { FiAirplay, FiUserCheck, FiCheck, FiChevronDown } from "react-icons/fi";
import { signIn } from "next-auth/react";
import { GlobeMap } from "@/components/GlobeMap";
import { DotPattern } from "@/components/DotPattern";
import { useMediaQuery } from "@mantine/hooks";
import { useDisclosure } from '@mantine/hooks';
import { LoginModal } from '@/modules/login/components/LoginModal';

export const HeroSection = () => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [loginOpened, { open: openLogin, close: closeLogin }] = useDisclosure(false); // <-- Estado del Modal
    
    return (
        <Box pos={'relative'}>
            <Stack
                style={{
                    position: 'absolute',
                    zIndex: 0
                }}
                top={0}
                left={0}
                w={'100vw'}
                h={'100vh'}
            >
                <DotPattern
                    width={20}
                    height={20}
                    cx={2}
                    cy={2}
                    cr={1.5}
                    color="#c22b2b"
                    opacity={0.2}
                />
            </Stack>

            <style>{`
                @keyframes ping {
                    0% {
                        transform: scale(0.8);
                        opacity: 1;
                    }
                    75%, 100% {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
                .animate-ping {
                    animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(8px); }
                }
                .animate-bounce {
                    animation: bounce 2s infinite;
                }
            `}</style>

            <Box
                style={{
                    background: `radial-gradient(circle at 10% 20%, ${primary[0]} 0%, ${primary[1]} 100%)`,
                    paddingTop: rem(40),
                    paddingBottom: rem(40),
                    minHeight: '100vh',
                    alignContent: 'center',
                }}
            >
                <Container size="lg">
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" verticalSpacing="xl">
                        {/* Columna izquierda */}
                        <Stack gap="lg" justify="center" style={{zIndex:0}}>
                            <Badge
                                size="lg"
                                radius="xl"
                                variant="light"
                                style={{
                                    alignSelf: "flex-start",
                                    backgroundColor: `${primary[4]}20`,
                                    color: primary[6],
                                    border: `1px solid ${primary[4]}40`,
                                    padding: "12px 18px",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ marginLeft: "4px", position: "relative", display: "inline-flex", width: "10px", height: "10px" }}>
                                        <span
                                            className="animate-ping"
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                borderRadius: "50%",
                                                backgroundColor: primary[4],
                                                opacity: 0.75,
                                            }}
                                        />
                                        <span
                                            style={{
                                                position: "relative",
                                                display: "inline-flex",
                                                width: "10px",
                                                height: "10px",
                                                borderRadius: "50%",
                                                backgroundColor: primary[4],
                                            }}
                                        />
                                    </span>
                                    <span>Flight Management System V1</span>
                                </div>
                            </Badge>

                            <Title
                                order={1}
                                fz={{ base: rem(32), md: rem(42) }}
                                fw={800}
                                lh={1.2}
                                style={{ color: primary[7] }}
                            >
                                FlyControl:{" "}
                                <Text
                                    component="span"
                                    inherit
                                    style={{ color: primary[4], position: "relative", display: "inline-block" }}
                                >
                                    Tu Centro de Gestión de Vuelos
                                </Text>{" "}
                                Todo en un solo lugar
                            </Title>

                            <Text size="md" c="dimmed" maw={550} style={{ color: primary[8] }}>
                                La plataforma definitiva para gestionar reservas, itinerarios de vuelo y control de pasajeros.
                                Simplifica tus operaciones aéreas con una interfaz intuitiva y potente.
                            </Text>

                            {/* Lista de características */}
                            <Stack gap="xs" mt="md">
                                <Group gap="xs">
                                    <ThemeIcon size="sm" variant="light" color="orange" radius="xl">
                                        <FiCheck size={12} />
                                    </ThemeIcon>
                                    <Text size="sm">Reservas en tiempo real</Text>
                                </Group>
                                <Group gap="xs">
                                    <ThemeIcon size="sm" variant="light" color="orange" radius="xl">
                                        <FiCheck size={12} />
                                    </ThemeIcon>
                                    <Text size="sm">Itinerarios con múltiples escalas</Text>
                                </Group>
                                <Group gap="xs">
                                    <ThemeIcon size="sm" variant="light" color="orange" radius="xl">
                                        <FiCheck size={12} />
                                    </ThemeIcon>
                                    <Text size="sm">Generación de boletos PDF</Text>
                                </Group>
                            </Stack>

                            <Group gap="md">
                                <Button onClick={openLogin} size="md" leftSection={<FcGoogle size={22} />} variant="default" radius="xl" px={30}>
                                    Comienza ahora
                                </Button>
                                <Button
                                    component="a"
                                    href="#features"
                                    variant="outline"
                                    radius="xl"
                                    px={30}
                                    size="md"
                                    style={{ borderColor: primary[4], color: primary[6] }}
                                >
                                    Conocer más
                                </Button>
                            </Group>

                            <Group gap="xs" mt="sm">
                                <Group gap={0}>
                                    <Avatar size="sm" radius="xl" bg={primary[2]} style={{ border: `2px solid ${primary[0]}` }}>
                                        <FiUserCheck size={12} />
                                    </Avatar>
                                    <Avatar size="sm" radius="xl" bg={primary[2]} style={{ border: `2px solid ${primary[0]}` }}>
                                        <FiAirplay size={12} />
                                    </Avatar>
                                    <Avatar size="sm" radius="xl" bg={primary[2]} style={{ border: `2px solid ${primary[0]}` }}>
                                        +50
                                    </Avatar>
                                </Group>
                                <Text size="sm" c="dimmed">
                                    Agencias y operadores ya confían en nosotros
                                </Text>
                            </Group>

                            {/* Estadística adicional */}
                            <Text size="xs" c="dimmed" mt="sm">
                                +150 vuelos gestionados este mes
                            </Text>
                        </Stack>

                        {/* Columna derecha: Globo terráqueo interactivo */}
                        <Box
                            style={{
                                width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center',
                                ...(isMobile && {
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    zIndex: 1,
                                    opacity: 0.4, // opcional para que no opaque el texto
                                    pointerEvents: 'none', // evita interacciones táctiles
                                }),
                            }}
                        >
                            <Box style={{ width: '100%', maxWidth: 500, margin: '0 auto' }}>
                                <GlobeMap />
                            </Box>
                        </Box>
                    </SimpleGrid>

                    {/* Scroll down indicator */}
                    <Box style={{ textAlign: 'center', marginTop: rem(60) }}>
                        <Text size="xs" c="dimmed">Descubre más</Text>
                        <FiChevronDown size={24} style={{ marginTop: 4, color: primary[5] }} className="animate-bounce" />
                    </Box>
                </Container>
            </Box>

            <LoginModal opened={loginOpened} onClose={closeLogin} />
        </Box>
    );
};