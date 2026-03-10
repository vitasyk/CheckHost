'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useXRay } from '@/components/admin/XRayProvider';
import { Edit3, EyeOff } from 'lucide-react';

interface AdSlotProps {
    slotType: string;
    className?: string;
    alignment?: 'left' | 'right' | 'center';
}

export function AdSlot({ slotType, className = "", alignment: propsAlignment }: AdSlotProps) {
    const [config, setConfig] = useState<any>(null);
    const [mounted, setMounted] = useState(false);
    const [hasConsent, setHasConsent] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);
    const initializedRef = useRef<string | null>(null);
    const { isXRayActive } = useXRay();

    // Create a unique key for the current logical page (path + tab)
    const adKey = `${pathname}?${searchParams.toString()}`;

    useEffect(() => {
        setMounted(true);
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

        // TCF 2.2 Consent Check
        const checkConsent = () => {
            if (typeof window !== 'undefined' && (window as any).__tcfapi) {
                (window as any).__tcfapi('addEventListener', 2, (tcData: any, success: boolean) => {
                    if (success && (tcData.eventStatus === 'tcloaded' || tcData.eventStatus === 'useractioncomplete')) {
                        // Check if purpose 1 (Store and/or access information on a device) is granted
                        const consentGranted = tcData.purpose?.consents?.[1] === true;
                        setHasConsent(consentGranted);
                    }
                });
            } else {
                // If no CMP is detected after some time, assume consent managed elsewhere or not required
                // (Or default to true if you are not in a strictly regulated region, but for AdSense compliance, 
                // it's safer to wait if script is present).
                // For now, if no TCF API found, we allow ads (fallback).
                setHasConsent(true);
            }
        };

        const consentTimer = setTimeout(checkConsent, 1000);
        return () => clearTimeout(consentTimer);
    }, []);

    // Determine active config for this slot
    const getSlotConfig = () => {
        if (!config) return null;
        let slotConfig = config.slots?.[slotType];

        const currentUrl = `${pathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
        if (config.placements && config.placements.length > 0) {
            const matchedPlacement = config.placements.find((p: any) => {
                if (!p.enabled || p.zone !== slotType) return false;
                if (p.path_pattern === '*') return true;
                return currentUrl.includes(p.path_pattern);
            });
            if (matchedPlacement) {
                slotConfig = matchedPlacement;
            }
        }
        return slotConfig;
    };

    const slotConfig = getSlotConfig();
    const isSlotEnabled = slotConfig?.enabled;
    const alignment = propsAlignment || slotConfig?.alignment || 'center';

    const defaultMinHeight = slotType.includes('sidebar') ? '600px' :
        slotType.includes('header') || slotType.includes('top') ? '90px' :
            '250px';

    useEffect(() => {
        if (!mounted || !config || !config.enabled) return;
        if (!isSlotEnabled || !hasConsent) return;

        const initAd = () => {
            if (!containerRef.current) return;
            const width = containerRef.current.offsetWidth;
            if (width === 0) {
                setTimeout(initAd, 100);
                return;
            }

            containerRef.current.innerHTML = '';
            const ins = document.createElement('ins');
            ins.className = 'adsbygoogle';
            ins.style.display = 'block';
            if (slotConfig?.width) ins.style.width = `${slotConfig.width}px`;
            if (slotConfig?.height) ins.style.height = `${slotConfig.height}px`;
            ins.style.minHeight = slotConfig?.height ? `${slotConfig.height}px` : defaultMinHeight;
            ins.setAttribute('data-ad-client', config.client_id);
            ins.setAttribute('data-ad-slot', slotConfig?.id);
            ins.setAttribute('data-ad-format', slotConfig?.width ? 'none' : 'auto');
            ins.setAttribute('data-full-width-responsive', slotConfig?.width ? 'false' : 'true');
            containerRef.current.appendChild(ins);

            if (!window.adsbygoogle) {
                const script = document.createElement('script');
                script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.client_id}`;
                script.async = true;
                script.crossOrigin = "anonymous";
                document.head.appendChild(script);
            }

            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                initializedRef.current = adKey;
            } catch (e) {
                console.error('AdSense initialization error:', e);
            }
        };

        const timer = setTimeout(initAd, 200);
        return () => clearTimeout(timer);
    }, [mounted, config, slotType, adKey, isSlotEnabled, slotConfig?.height, slotConfig?.id, slotConfig?.width, defaultMinHeight]);

    if (!mounted || !config) return null;

    if (!config.enabled && !isXRayActive) {
        return null;
    }

    if (!isSlotEnabled && !isXRayActive) {
        return null;
    }

    const alignmentClasses = {
        center: 'mx-auto flex justify-center',
        left: 'mr-auto float-left mr-8 mb-8',
        right: 'ml-auto float-right ml-8 mb-8'
    }[alignment as 'center' | 'left' | 'right'] || 'mx-auto flex justify-center';

    const handleEditClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const params = new URLSearchParams(searchParams.toString());
        params.set('edit_ad', slotType);
        router.push(`${pathname}?${params.toString()}`);
    };

    const isSticky = slotConfig?.sticky && slotType.includes('sidebar');

    const adContent = (
        <div
            className={`ad-container relative ${alignmentClasses} ${className} transition-all duration-300 ${isXRayActive ? 'ring-2 ring-indigo-500/50 hover:ring-indigo-500 rounded-xl overflow-hidden cursor-pointer' : ''}`}
            style={{
                minHeight: slotConfig?.height ? `${slotConfig.height}px` : defaultMinHeight,
                width: slotConfig?.width ? `${slotConfig.width}px` : '100%',
                maxWidth: '100%',
                clear: alignment !== 'center' ? 'none' : 'both',
                margin: alignment === 'center' ? (slotType.includes('sidebar') ? '0' : '2rem auto') : undefined
            }}
            onClick={isXRayActive ? handleEditClick : undefined}
            title={isXRayActive ? `Edit ${slotType}` : undefined}
        >
            <div ref={containerRef} className={`w-full h-full ${(!isSlotEnabled && isXRayActive) ? 'hidden' : ''}`}>
                <ins
                    className="adsbygoogle"
                    style={{
                        display: 'block',
                        width: slotConfig?.width ? `${slotConfig.width}px` : '100%',
                        height: slotConfig?.height ? `${slotConfig.height}px` : 'auto',
                        minHeight: slotConfig?.height ? `${slotConfig.height}px` : defaultMinHeight
                    }}
                    data-ad-client={config.client_id}
                    data-ad-slot={slotConfig?.id}
                    data-ad-format={slotConfig?.width ? undefined : "auto"}
                    data-full-width-responsive={slotConfig?.width ? "false" : "true"}
                ></ins>
            </div>

            {isXRayActive && (
                <div className={`absolute inset-0 border-2 border-dashed flex flex-col items-center justify-center transition-colors rounded-xl overflow-hidden bg-indigo-900/40 backdrop-blur-[2px] border-indigo-400 hover:bg-indigo-900/60 pointer-events-none`}>
                    <div className="flex flex-col items-center gap-3">
                        <div className="bg-indigo-600 text-white rounded-full p-3 shadow-xl transform scale-100 hover:scale-110 transition-transform">
                            <Edit3 className="h-5 w-5" />
                        </div>
                        <div className="text-center">
                            <span className="block text-sm font-bold text-white drop-shadow-md">
                                {slotType}
                            </span>
                            {!isSlotEnabled && (
                                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-amber-300 mt-1 bg-black/40 px-2 py-0.5 rounded">
                                    <EyeOff className="h-3 w-3" /> Disabled
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    if (slotType.includes('sidebar')) {
        return (
            <div className={`site-sidebar-ad-wrapper ${isSticky ? 'sticky top-[100px]' : ''}`}>
                {adContent}
            </div>
        );
    }

    return adContent;
}

declare global {
    interface Window {
        adsbygoogle: any[];
    }
}
