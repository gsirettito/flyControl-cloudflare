// modules/login/components/LoginModal.tsx

import { useState, useEffect } from 'react';
import { Modal, Tabs, TextInput, PasswordInput, Button, Stack, Group, Text, Divider, Alert } from '@mantine/core';
import { FcGoogle } from 'react-icons/fc';
import { FiMail, FiLock, FiUser, FiCheckCircle } from 'react-icons/fi';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { notifications } from '@mantine/notifications';

export function LoginModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
    const [activeTab, setActiveTab] = useState<string | null>('login');
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Nuevos estados para feedback
    const [registerError, setRegisterError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const searchParams = useSearchParams();

    // Detectar si venimos de hacer clic en el enlace del correo
    useEffect(() => {
        if (searchParams.get('verified') === 'true') {
            setSuccessMessage('¡Correo verificado exitosamente! Ya puedes iniciar sesión.');
            setActiveTab('login');
        } else if (searchParams.get('error')) {
            notifications.show({
                title: 'Enlace inválido',
                message: 'El enlace de verificación es inválido o ha expirado.',
                color: 'red'
            });
        }
    }, [searchParams]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMessage('');

        const res = await signIn('credentials', {
            redirect: false,
            email,
            password,
        });

        if (res?.error) {
            // 👇 Manejo de errores con Toasts
            if (res.error === 'CredentialsSignin' && (res as {code?: string}).code !== 'email_not_verified') {
                notifications.show({
                    title: 'Acceso denegado',
                    message: 'Correo o contraseña incorrectos. Verifica tus datos.',
                    color: 'red',
                    autoClose: 5000,
                });
            } else if (res.error === 'EmailNotVerified' || (res as {code?: string}).code === 'email_not_verified') {
                notifications.show({
                    title: 'Cuenta no verificada',
                    message: 'Revisa tu correo. Si no llegó, vuelve a Registrarse con el mismo correo y contraseña para reenviarlo.',
                    color: 'orange',
                    autoClose: 8000,
                });
            } else {
                notifications.show({
                    title: 'Error',
                    message: 'Ocurrió un error inesperado al iniciar sesión.',
                    color: 'red',
                });
            }
        } else {
            window.location.href = '/home';
        }
        setLoading(false);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setRegisterError('');
        setSuccessMessage('');

        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
            setRegisterError(data.error || 'Error al registrar');
            setLoading(false);
            return;
        }

        // Éxito: Mostramos mensaje y pasamos a la pestaña de login
        setSuccessMessage('¡Registro exitoso! Por favor, revisa tu correo electrónico y haz clic en el enlace de verificación para poder iniciar sesión.');
        setActiveTab('login');
        // Limpiamos los campos
        setName('');
        setPassword('');
        setLoading(false);
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Accede a FlyControl" centered radius="md" size="md">
            <Stack>
                <Button
                    onClick={() => signIn('google', { redirectTo: '/home' })}
                    leftSection={<FcGoogle size={20} />}
                    variant="default"
                    fullWidth
                    size="md"
                >
                    Continuar con Google
                </Button>

                <Divider label="O usa tu correo" labelPosition="center" />

                <Tabs value={activeTab} onChange={setActiveTab}>
                    <Tabs.List grow mb="md">
                        <Tabs.Tab value="login">Iniciar Sesión</Tabs.Tab>
                        <Tabs.Tab value="register">Registrarse</Tabs.Tab>
                    </Tabs.List>

                    {/* 👇 El Alert de error solo se muestra en el registro */}
                    {registerError && <Alert color="red" mb="sm" title="Error">{registerError}</Alert>}
                    {successMessage && (
                        <Alert color="green" mb="sm" icon={<FiCheckCircle />} title="¡Atención!">
                            {successMessage}
                        </Alert>
                    )}

                    <Tabs.Panel value="login">
                        <form onSubmit={handleLogin}>
                            <Stack>
                                <TextInput
                                    label="Correo electrónico"
                                    placeholder="tu@correo.com"
                                    leftSection={<FiMail />}
                                    value={email}
                                    onChange={(e) => setEmail(e.currentTarget.value)}
                                    required
                                />
                                <PasswordInput
                                    label="Contraseña"
                                    leftSection={<FiLock />}
                                    value={password}
                                    onChange={(e) => setPassword(e.currentTarget.value)}
                                    required
                                />
                                <Button type="submit" loading={loading} fullWidth mt="sm">
                                    Entrar
                                </Button>
                            </Stack>
                        </form>
                    </Tabs.Panel>

                    <Tabs.Panel value="register">
                        <form onSubmit={handleRegister}>
                            <Stack>
                                <TextInput
                                    label="Nombre completo"
                                    placeholder="Juan Pérez"
                                    leftSection={<FiUser />}
                                    value={name}
                                    onChange={(e) => setName(e.currentTarget.value)}
                                    required
                                />
                                <TextInput
                                    label="Correo electrónico"
                                    placeholder="tu@correo.com"
                                    leftSection={<FiMail />}
                                    value={email}
                                    onChange={(e) => setEmail(e.currentTarget.value)}
                                    required
                                />
                                <PasswordInput
                                    label="Contraseña"
                                    leftSection={<FiLock />}
                                    value={password}
                                    onChange={(e) => setPassword(e.currentTarget.value)}
                                    required
                                />
                                <Button type="submit" loading={loading} fullWidth mt="sm">
                                    Crear cuenta
                                </Button>
                            </Stack>
                        </form>
                    </Tabs.Panel>
                </Tabs>
            </Stack>
        </Modal>
    );
}