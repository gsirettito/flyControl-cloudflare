'use client';

import { AppShell, Stack, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Sidebar } from '../ui/Sidebar';
import { Header } from '../ui/Header';
import { useOTP } from '@/store/otp';
import { UserType } from '@/types/ModelsType';
import { useEffect } from 'react';
import { Tracker } from '../Tracker';
import { FloatingActionMenu } from '../FloatingActionMenu';

export function DashboardLayout({
    children,
    user,
    onlyChildren = false
}: {
    children: React.ReactNode,
    user: UserType,
    onlyChildren?: boolean
}) {
    const { setProfile } = useOTP();
    const [opened, { toggle }] = useDisclosure(true);

    useEffect(() => {
        setProfile(user);
    }, [user, setProfile]);

    if (onlyChildren)
        return (
            <>
                <Tracker />
                {children}
            </>
        )

    return (
        <>
            <Tracker />
            <AppShell
                header={{ height: 60 }}
                navbar={{
                    width: { base: 300, sm: opened ? 300 : 60 },
                    breakpoint: 'sm',
                    collapsed: { mobile: !opened },
                }}
                padding="md"
                style={{ flex: 1 }}
            >
                <AppShell.Header>
                    <Stack gap={0} h="100%">
                        <Box style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                            <Header
                                opened={opened}
                                toggle={toggle}
                                companyName={user?.company?.commercialName} />
                        </Box>
                        {/* <DevelopmentBanner /> */}
                    </Stack>
                </AppShell.Header>

                <AppShell.Navbar>
                    <Sidebar user={user} opened={opened} />
                </AppShell.Navbar>

                <AppShell.Main>
                    <Stack gap="md">
                        {children}
                    </Stack>
                </AppShell.Main>

                <FloatingActionMenu />
                {/* <AppShell.Footer>
                    <Box py="md" ta="center" c="dimmed" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Text size="sm">
                            © {new Date().getFullYear()} <a href="https://noxcreation.dev/" target='_blank'>NOX Creation</a> - Todos los derechos reservados
                        </Text>
                    </Box>
                </AppShell.Footer> */}
            </AppShell>
        </>
    );
}