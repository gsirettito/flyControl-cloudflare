// components/ui/Header/NotificationMenu.tsx
'use client';

import { useState, useEffect } from 'react';
import { Menu, Center, ActionIcon, Indicator, ScrollArea, Text, Group, Box, Loader, UnstyledButton } from '@mantine/core';
import { FiBell } from 'react-icons/fi';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';
import { useRouter } from 'next/navigation';

dayjs.extend(relativeTime);
dayjs.locale('es');

export function NotificationMenu() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/system/notifications');
            const data = await res.json();
            if (data.data) setNotifications(data.data);
        } catch (error) {
            console.error('Error cargando notificaciones:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // 🔥 Mejora: Polling cada 30 segundos en lugar de 60
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleReadAll = async () => {
        // 🔥 FIX: Actualización optimista (la UI cambia al instante)
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

        try {
            await fetch('/api/system/notifications', {
                method: 'POST',
                // 🔥 FIX CRÍTICO: Faltaba el Content-Type para que la API pueda leer el JSON
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
        } catch (error) {
            console.error('Error marcando todas como leídas:', error);
            fetchNotifications(); // Si falla, recargamos el estado real
        }
    };

    const handleNotificationClick = async (notif: any) => {
        if (!notif.isRead) {
            // 🔥 FIX: Actualización optimista local
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));

            try {
                await fetch('/api/system/notifications', {
                    method: 'POST',
                    // 🔥 FIX CRÍTICO: Faltaba el Content-Type
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: [notif.id] })
                });
            } catch (error) {
                console.error('Error marcando notificación como leída:', error);
            }
        }
        if (notif.link) {
            router.push(notif.link);
        }
    };

    return (
        <Menu shadow="md" width={360} position="bottom-end" withinPortal>
            <Menu.Target>
                <Indicator inline label={unreadCount} size={16} disabled={unreadCount === 0} color="red" offset={4}>
                    <ActionIcon variant="transparent" size="lg" title="Notificaciones" color="gray">
                        <FiBell size={20} />
                    </ActionIcon>
                </Indicator>
            </Menu.Target>

            <Menu.Dropdown p={0}>
                {/* Header del menú */}
                <Group justify="space-between" px="md" py="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                    <Text fw={700} size="sm">Notificaciones</Text>
                    {unreadCount > 0 && (
                        <UnstyledButton
                            onClick={handleReadAll}
                            style={{
                                fontSize: '12px',
                                color: 'var(--mantine-color-primary-filled)',
                                fontWeight: 500
                            }}
                        >
                            Marcar todas leídas
                        </UnstyledButton>
                    )}
                </Group>

                <ScrollArea h={350}>
                    {loading ? (
                        <Center h={150}><Loader size="sm" color="primary" /></Center>
                    ) : notifications.length === 0 ? (
                        <Center h={150}>
                            <Text size="sm" c="dimmed">No tienes notificaciones</Text>
                        </Center>
                    ) : (
                        notifications.map((notif) => (
                            <Menu.Item
                                key={notif.id}
                                onClick={() => handleNotificationClick(notif)}
                                p={0}
                                style={{
                                    borderBottom: '1px solid var(--mantine-color-gray-1)',
                                    backgroundColor: notif.isRead ? 'transparent' : 'var(--mantine-color-primary-0)'
                                }}
                            >
                                <Box p="md" style={{ cursor: 'pointer' }}>
                                    <Group justify="space-between" mb={4} wrap="nowrap" align="flex-start">
                                        <Text
                                            fw={notif.isRead ? 500 : 700}
                                            size="sm"
                                            c={
                                                notif.type === 'ERROR' ? 'red.7' :
                                                    notif.type === 'SUCCESS' ? 'green.7' :
                                                        notif.type === 'WARNING' ? 'orange.7' : 'blue.7'
                                            }
                                        >
                                            {notif.title}
                                        </Text>
                                        <Text size="10px" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                                            {dayjs(notif.createdAt).fromNow()}
                                        </Text>
                                    </Group>
                                    <Text size="xs" c={notif.isRead ? "dimmed" : "dark.7"} lineClamp={2} lh={1.4}>
                                        {notif.message}
                                    </Text>
                                </Box>
                            </Menu.Item>
                        ))
                    )}
                </ScrollArea>
            </Menu.Dropdown>
        </Menu>
    );
}