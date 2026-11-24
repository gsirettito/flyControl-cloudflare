import { primary, secondary } from "@/components/ui/Theme/color"
import { Box, Container, SimpleGrid, Group, ThemeIcon, Stack, Divider, Text, Image } from "@mantine/core"
import { FiShield } from "react-icons/fi"

export const Footer = () => {
    return (
        <Box bg={secondary[9]} style={{ borderTop: `1px solid ${primary[9]}`, paddingTop: 40, paddingBottom: 24 }}>
            <Container size="lg">
                <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="xl">
                    <Box>
                        <Group gap="xs" mb="md">
                            {/* <ThemeIcon size="md" radius="xl" variant="filled" color="primary">
                                <FiShield size={14} />
                            </ThemeIcon> */}
                            <Image src={"/favicon.png"} w={"44px"} />
                            <Text fw={700} c="white">
                                FlyControl
                            </Text>
                        </Group>
                        <Text size="xs" c="gray.4">
                            Infraestructura de gestión y reserva de viajes en Cuba y el mundo.
                            Simplifica tus operaciones aéreas en segundos.
                        </Text>
                    </Box>
                    <div>
                        <Text fw={600} mb="sm" c="white" size="sm" tt="uppercase">
                            Producto
                        </Text>
                        <Stack gap="xs">
                            <Text component="a" href="#" size="xs" c="gray.6">
                                Documentación
                            </Text>
                            <Text component="a" href="#" size="xs" c="gray.6">
                                API Reference
                            </Text>
                            <Text component="a" href="#pricing" size="xs" c="gray.6">
                                Precios
                            </Text>
                            <Text component="a" href="#" size="xs" c="gray.6">
                                Status
                            </Text>
                        </Stack>
                    </div>
                    <div>
                        <Text fw={600} mb="sm" c="white" size="sm" tt="uppercase">
                            Compañía
                        </Text>
                        <Stack gap="xs">
                            <Text component="a" href="#" size="xs" c="gray.6">
                                Acerca de
                            </Text>
                            <Text component="a" href="#" size="xs" c="gray.6">
                                Blog
                            </Text>
                            <Text component="a" href="#" size="xs" c="gray.6">
                                Contacto
                            </Text>
                        </Stack>
                    </div>
                    <div>
                        <Text fw={600} mb="sm" c="white" size="sm" tt="uppercase">
                            Legal
                        </Text>
                        <Stack gap="xs">
                            <Text component="a" href="#" size="xs" c="gray.6">
                                Privacidad
                            </Text>
                            <Text component="a" href="#" size="xs" c="gray.6">
                                Términos
                            </Text>
                            <Text component="a" href="#" size="xs" c="gray.6">
                                Seguridad
                            </Text>
                        </Stack>
                    </div>
                </SimpleGrid>
                <Divider my="lg" style={{ borderColor: "#4c4c4c" }} />
                <Group justify="space-between">
                    <Text size="xs" style={{ color: primary[3] }}>
                        © 2026 Nox Creation. Todos los derechos reservados.
                    </Text>
                    <Group gap="xs">
                        <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#22c55e" }} />
                        <Text size="xs" c="gray.4">
                            Sistemas operativos
                        </Text>
                    </Group>
                </Group>
            </Container>
        </Box>
    )
}