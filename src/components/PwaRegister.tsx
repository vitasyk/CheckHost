'use client';

import { useEffect } from 'react';

export function PwaRegister() {
    useEffect(() => {
        // Skip service worker registration in development (Turbopack doesn't support it)
        if (process.env.NODE_ENV !== 'production') return;

        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/sw.js', { scope: '/' })
                    .then((registration) => {
                        console.log('[PWA] Service Worker registered:', registration.scope);

                        // Check for updates every 60 seconds when app is open
                        setInterval(() => {
                            registration.update();
                        }, 60000);
                    })
                    .catch((error) => {
                        console.error('[PWA] Service Worker registration failed:', error);
                    });
            });
        }
    }, []);

    return null;
}
