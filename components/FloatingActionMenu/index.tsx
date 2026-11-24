// components/FloatingActionMenu/index.tsx
'use client';

import { Affix, Menu, ActionIcon } from '@mantine/core';
import { FiPlus, FiUserPlus, FiNavigation, FiBookOpen, FiUploadCloud } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react'; // 🔒 FIX: Importamos useSession

export function FloatingActionMenu() {
    const router = useRouter();
    const { data: session } = useSession(); // 🔒 FIX: Obtenemos la sesión
    const isAdmin = session?.user?.isAdmin || false; // 🔒 FIX: Verificamos el rol

    return (
        <Affix position={{ bottom: 30, right: 30 }}>
            <Menu shadow="md" width={220} position="top-end" radius="md">
                <Menu.Target>
                    <ActionIcon
                        size={60}
                        radius="xl"
                        variant="filled"
                        color="primary"
                        style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', transition: 'transform 0.2s ease' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <FiPlus size={28} />
                    </ActionIcon>
                </Menu.Target>

                <Menu.Dropdown>
                    <Menu.Label>Acciones Rápidas</Menu.Label>

                    <Menu.Item leftSection={<FiUserPlus size={16} />} onClick={() => router.push('/clients?action=create')}>
                        Crear Cliente
                    </Menu.Item>

                    {/* 🔒 FIX: Solo mostramos esta opción si es Admin */}
                    {isAdmin && (
                        <Menu.Item leftSection={<FiNavigation size={16} />} onClick={() => router.push('/flight?action=create')}>
                            Crear Vuelo
                        </Menu.Item>
                    )}

                    <Menu.Item leftSection={<FiBookOpen size={16} />} onClick={() => router.push('/reservations')}>
                        Crear Reserva
                    </Menu.Item>

                    <Menu.Divider />

                    <Menu.Item leftSection={<FiUploadCloud size={16} />} onClick={() => router.push('/reservations/list?action=import')} color="blue">
                        Importar desde Texto
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>
        </Affix>
    );
}