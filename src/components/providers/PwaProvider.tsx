'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface PwaContextType {
    isInstallable: boolean;
    isStandalone: boolean;
    installApp: () => Promise<void>;
}

const PwaContext = createContext<PwaContextType>({
    isInstallable: false,
    isStandalone: false,
    installApp: async () => { },
});

export const usePwa = () => useContext(PwaContext);

export function PwaProvider({ children }: { children: React.ReactNode }) {
    const [isInstallable, setIsInstallable] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Already installed?
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsStandalone(true);
            return;
        }

        // Check if prompt was already captured before this component mounted
        if ((window as any).__pwaPrompt) {
            setIsInstallable(true);
        }

        // Also listen for future events
        const handler = (e: any) => {
            e.preventDefault();
            (window as any).__pwaPrompt = e;
            setIsInstallable(true);
        };
        window.addEventListener('beforeinstallprompt', handler);

        // When installed, clear
        const onInstalled = () => {
            (window as any).__pwaPrompt = null;
            setIsInstallable(false);
        };
        window.addEventListener('appinstalled', onInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);

    const installApp = async () => {
        const prompt = (window as any).__pwaPrompt;
        if (!prompt) return;
        prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') {
            (window as any).__pwaPrompt = null;
            setIsInstallable(false);
        }
    };

    return (
        <PwaContext.Provider value={{ isInstallable, isStandalone, installApp }}>
            {children}
        </PwaContext.Provider>
    );
}
