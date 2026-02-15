'use client';

import { useEffect, useState } from 'react';

interface AdSlotProps {
    slotType: string;
    className?: string;
}

interface AdConfig {
    client_id: string;
    enabled: boolean;
    slots: Record<string, { id: string; enabled: boolean }>;
}

export function AdSlot({ slotType, className = "" }: AdSlotProps) {
    const [config, setConfig] = useState<AdConfig | null>(null);
    const [displayed, setDisplayed] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch('/api/adsense-config');
                if (res.ok) {
                    const data = await res.json();
                    setConfig(data);
                }
            } catch (error) {
                console.error('Failed to load AdSense config:', error);
            }
        };
        fetchConfig();
    }, []);

    useEffect(() => {
        if (!config || !config.enabled || !config.slots[slotType]?.enabled) return;

        // Ensure AdSense script is loaded
        if (!window.adsbygoogle) {
            const script = document.createElement('script');
            script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.client_id}`;
            script.async = true;
            script.crossOrigin = "anonymous";
            document.head.appendChild(script);
        }

        // Initialize ad
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            setDisplayed(true);
        } catch (e) {
            console.error('AdSense error:', e);
        }
    }, [config, slotType]);

    if (!config || !config.enabled || !config.slots[slotType]?.enabled) {
        return null;
    }

    return (
        <div className={`ad-container my-8 flex justify-center overflow-hidden ${className}`}>
            <ins
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client={config.client_id}
                data-ad-slot={config.slots[slotType].id}
                data-ad-format="auto"
                data-full-width-responsive="true"
            ></ins>
        </div>
    );
}

// Global type for AdSense
declare global {
    interface Window {
        adsbygoogle: any[];
    }
}
