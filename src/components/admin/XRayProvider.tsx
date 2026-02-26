'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface XRayContextType {
    isXRayActive: boolean;
    toggleXRay: () => void;
}

const XRayContext = createContext<XRayContextType>({
    isXRayActive: false,
    toggleXRay: () => { },
});

export function XRayProvider({ children }: { children: ReactNode }) {
    const { data: session } = useSession();
    const isAdmin = !!session?.user;

    const [isXRayActive, setIsXRayActive] = useState(false);

    useEffect(() => {
        if (isAdmin) {
            const saved = localStorage.getItem('checkhost_xray_mode');
            if (saved === 'true') {
                setIsXRayActive(true);
            }
        } else {
            setIsXRayActive(false);
        }
    }, [isAdmin]);

    const toggleXRay = () => {
        setIsXRayActive(prev => {
            const next = !prev;
            localStorage.setItem('checkhost_xray_mode', String(next));
            return next;
        });
    };

    useEffect(() => {
        if (isXRayActive && isAdmin) {
            document.body.classList.add('xray-mode-active');
        } else {
            document.body.classList.remove('xray-mode-active');
        }
    }, [isXRayActive, isAdmin]);

    return (
        <XRayContext.Provider value={{ isXRayActive: isAdmin && isXRayActive, toggleXRay }}>
            {children}
        </XRayContext.Provider>
    );
}

export const useXRay = () => useContext(XRayContext);
