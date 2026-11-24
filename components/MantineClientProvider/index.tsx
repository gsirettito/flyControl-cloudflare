'use client';

import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/carousel/styles.css';
import '@mantine/dates/styles.css';
import theme from '../ui/Theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import NextTopLoader from 'nextjs-toploader';
import { primary } from '../ui/Theme/color';

export default function MantineClientProvider({
    children,
}: {
    children: React.ReactNode;
}) {

    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: false, // opcional, mejora rendimiento
                retry: 1,
            },
        },
    });

    return (
        <SessionProvider>
            <NextTopLoader
                color={primary[4]}
                initialPosition={0.08}
                crawlSpeed={200}
                height={4}
                crawl={true}
                showSpinner={false}
                easing="ease"
                speed={200}
                shadow={`0 0 10px ${primary[8]},0 0 5px ${primary[8]}`}
                zIndex={1600}
            />
            <QueryClientProvider client={queryClient}>
                <MantineProvider theme={theme}>
                    <ModalsProvider>
                        <Notifications />
                        {children}
                    </ModalsProvider>
                </MantineProvider>
            </QueryClientProvider>
        </SessionProvider>
    );
}