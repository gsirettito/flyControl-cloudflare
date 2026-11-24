'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
    Burger, Group, Text, Menu,
    Avatar, UnstyledButton, Stack, Button, Flex, Badge, Anchor
} from '@mantine/core';
import { FiSun, FiMoon, FiChevronDown, FiBarChart, FiCalendar, FiUsers } from 'react-icons/fi';
import classes from './Header.module.css';
import { menuHeader } from './menuHeader';
import Link from 'next/link';
import { CiPlane } from "react-icons/ci";
import { getHeaderStats } from '@/actions/stats';
import { NotificationMenu } from './NotificationMenu';

interface HeaderProps {
    opened: boolean;
    toggle: () => void;
    companyName?: string;
}

export function Header({ opened, toggle, companyName }: HeaderProps) {
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);
    const { data: session } = useSession();
    const [userMenuOpened, setUserMenuOpened] = useState(false);

    const [stats, setStats] = useState({ users: 0, reservations: 0, airlines: 0, clients: 0 });
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        setIsMounted(true);

        // Cargar estadísticas desde la Server Action
        const loadStats = async () => {
            const data = await getHeaderStats();
            setStats(data);
            setLoadingStats(false);
        };

        loadStats();
    }, []);

    // Renderiza un placeholder simple durante la hidratación
    if (!isMounted) {
        return <div style={{ width: 28, height: 28 }} />;
    }

    // Manejar cierre de sesión
    const handleLogout = async () => {
        await signOut({ redirect: false }); // No redirige automáticamente
        router.push('/'); // Redirige manualmente al login
    };

    // Datos del usuario desde la sesión
    const userName = session?.user?.name || 'Usuario';
    const userImage = session?.user?.image || null;
    const userEmail = session?.user?.email || '';

    return (
        <Group h="100%" px="md" justify="space-between" wrap="nowrap" w={'100%'}>
            <Group wrap="nowrap" gap="xs">
                <Burger opened={opened} onClick={toggle} size="sm" />

                <Anchor
                    component={Link}
                    href="/home"
                    underline="never"
                    style={{
                        fontSize: '20px',
                        fontWeight: 800,
                        color: 'var(--mantine-color-primary-filled)',
                        letterSpacing: '-0.5px'
                    }}
                >
                    {companyName || 'FlyControl'}
                </Anchor>

                <Flex gap={10} align={'center'} visibleFrom='md'>
                    {/* Un separador visual */}
                    <div style={{ width: 1, height: 24, backgroundColor: 'var(--mantine-color-gray-3)' }} />

                    <Badge color='teal' variant='light'>
                        <FiBarChart /> {loadingStats ? '...' : stats.users} usuarios
                    </Badge>
                    <Badge color='orange' variant='light'>
                        <FiUsers /> {loadingStats ? '...' : stats.clients} clientes
                    </Badge>
                    <Badge color='indigo' variant='light'>
                        <FiCalendar /> {loadingStats ? '...' : stats.reservations} reservas
                    </Badge>
                    <Badge color='lime' variant='light'>
                        <CiPlane /> {loadingStats ? '...' : stats.airlines} aerolineas
                    </Badge>
                </Flex>

            </Group>

            <Group wrap="nowrap" gap="xs" >
                
                {/* <PillButtonCurrency /> */}
                <NotificationMenu />

                <Menu
                    width={260}
                    position="bottom-end"
                    transitionProps={{ transition: 'pop-top-right' }}
                    onClose={() => setUserMenuOpened(false)}
                    onOpen={() => setUserMenuOpened(true)}
                    withinPortal
                >
                    <Menu.Target>
                        <UnstyledButton className={`${classes.user} ${userMenuOpened ? classes.userActive : ''}`}>
                            <Group gap={7}>
                                <Avatar src={userImage} alt="" radius="xl" size={26} color="primary">
                                    {!userImage && userName.charAt(0).toUpperCase()}
                                </Avatar>

                                <Stack gap={2} visibleFrom='sm'  >
                                    <Text fw={500} size="sm" lh={1} mr={3}>
                                        {userName}
                                    </Text>
                                    <Text fw={500} size="10px" lh={1} mr={3} style={{ color: "var(--mantine-color-gray-6)" }}>
                                        {userEmail}
                                    </Text>
                                </Stack>
                                <FiChevronDown size={12} />
                            </Group>
                        </UnstyledButton>
                    </Menu.Target>

                    <Menu.Dropdown>
                        {menuHeader.map((group, idx) => (
                            <div key={group.label || idx}>
                                {idx > 0 && <Menu.Divider />}
                                {group.label && <Menu.Label>{group.label}</Menu.Label>}
                                {group.options.map((option) => {
                                    // Para la opción "Cerrar sesión" usamos la acción personalizada
                                    if (option.label === 'Cerrar sesión') {
                                        return (
                                            <Menu.Item
                                                key={option.label}
                                                leftSection={option.icon}
                                                onClick={handleLogout}
                                            /* color={option.color} */
                                            >
                                                {option.label}
                                            </Menu.Item>
                                        );
                                    }
                                    // Las demás opciones pueden tener otros manejadores (por ahora solo un console.log)
                                    return (
                                        <Menu.Item
                                            key={option.label}
                                            leftSection={option.icon}
                                            onClick={() => console.log(`Navegar a: ${option.label}`)}
                                        /* color={option.color} */
                                        >
                                            {option.label}
                                        </Menu.Item>
                                    );
                                })}
                            </div>
                        ))}
                    </Menu.Dropdown>
                </Menu>
            </Group>
        </Group>
    );
}