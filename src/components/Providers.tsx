'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
                refetchOnWindowFocus: false,
            },
        },
    });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
    if (typeof window === 'undefined') {
        // Завжди створюємо новий клієнт на сервері
        return makeQueryClient();
    } else {
        // Створюємо клієнт на клієнті лише один раз
        if (!browserQueryClient) browserQueryClient = makeQueryClient();
        return browserQueryClient;
    }
}

import { XRayProvider } from '@/components/admin/XRayProvider';

export function Providers({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
    const queryClient = getQueryClient();

    return (
        <SessionProvider>
            <QueryClientProvider client={queryClient}>
                <NextThemesProvider {...props}>
                    <XRayProvider>
                        {children}
                    </XRayProvider>
                </NextThemesProvider>
            </QueryClientProvider>
        </SessionProvider>
    );
}
