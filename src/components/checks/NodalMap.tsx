'use client';

import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Node } from '@/types/checkhost';
import { geocodeNode } from '@/lib/node-geocoder';
import { Badge } from '@/components/ui/badge';
import { MapPin, Globe, Check, Info } from 'lucide-react';
import { useTheme } from 'next-themes';

interface NodalMapProps {
    nodes: Record<string, Node>;
    selectedNodeIds: string[];
    onToggleNode: (nodeId: string) => void;
}

// Fix for default marker icons in Leaflet with Next.js
const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const selectedIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

export default function NodalMap({ nodes, selectedNodeIds, onToggleNode }: NodalMapProps) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Create markers from nodes
    const nodeMarkers = useMemo(() => {
        return Object.values(nodes).map(node => {
            const coords = geocodeNode(node.city, node.country, node.countryCode);
            return {
                ...node,
                lat: coords.lat,
                lng: coords.lng
            };
        });
    }, [nodes]);

    if (!mounted) return null;

    const isDark = theme === 'dark';
    const tileUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    return (
        <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/5 relative bg-slate-50 dark:bg-slate-950/20">
            <MapContainer
                center={[20, 0]}
                zoom={2}
                style={{ height: '100%', width: '100%', background: 'transparent' }}
                scrollWheelZoom={false}
                attributionControl={false}
            >
                <TileLayer
                    key={theme} // Force re-render when theme changes to update tiles
                    url={tileUrl}
                />

                {nodeMarkers.map(node => (
                    <Marker
                        key={node.id}
                        position={[node.lat, node.lng]}
                        icon={selectedNodeIds.includes(node.id) ? selectedIcon : defaultIcon}
                        eventHandlers={{
                            click: () => onToggleNode(node.id),
                        }}
                    >
                        <Popup className="custom-popup">
                            <div className="p-2 space-y-2 min-w-[180px]">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{node.city}, {node.country}</h4>
                                    <Badge variant="outline" className="text-[10px] uppercase">{node.countryCode}</Badge>
                                </div>
                                <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                        <Info className="h-3 w-3" />
                                        <span>Node ID: {node.id}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                        <Globe className="h-3 w-3" />
                                        <span>ASN: {node.asn}</span>
                                    </div>
                                </div>
                                {selectedNodeIds.includes(node.id) ? (
                                    <div className="mt-2 flex items-center justify-between py-1.5 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-500/20">
                                        <div className="flex items-center gap-1.5">
                                            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">Selected</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleNode(node.id);
                                            }}
                                            className="text-[10px] font-medium text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer underline underline-offset-2"
                                        >
                                            remove
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleNode(node.id);
                                        }}
                                        className="w-full mt-2 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400"
                                    >
                                        <MapPin className="h-3 w-3" />
                                        Select Node
                                    </button>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Selection Stats Overlay */}
            <div className="absolute bottom-4 left-4 z-[1000] pointer-events-none">
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-200/50 dark:border-white/5 shadow-lg flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <Globe className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-none">Selected Nodes</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white leading-none mt-1">{selectedNodeIds.length}</p>
                    </div>
                    {selectedNodeIds.length > 0 && (
                        <div className="h-4 w-px bg-slate-200 dark:bg-white/10 mx-1" />
                    )}
                    {selectedNodeIds.length > 0 && (
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-tight">Active Filter</span>
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
                .leaflet-container {
                    background: transparent !important;
                }
                .leaflet-bar {
                    border: none !important;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
                    border-radius: 8px !important;
                    overflow: hidden;
                }
                .leaflet-bar a {
                    background-color: white !important;
                    border-bottom: 1px solid #f1f5f9 !important;
                    color: #64748b !important;
                    font-weight: bold !important;
                }
                .leaflet-bar a:hover {
                    background-color: #f8fafc !important;
                    color: #4f46e5 !important;
                }
                .dark .leaflet-bar a {
                    background-color: #1e293b !important;
                    border-bottom: 1px solid rgba(255,255,255,0.05) !important;
                    color: #94a3b8 !important;
                }
                .dark .leaflet-bar a:hover {
                    background-color: #334155 !important;
                    color: #818cf8 !important;
                }
                .custom-popup .leaflet-popup-content-wrapper {
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 12px;
                    border: 1px solid rgba(226, 232, 240, 0.6);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                }
                .dark .custom-popup .leaflet-popup-content-wrapper {
                    background: rgba(15, 23, 42, 0.95);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }
                .custom-popup .leaflet-popup-tip {
                    background: rgba(255, 255, 255, 0.95);
                }
                .dark .custom-popup .leaflet-popup-tip {
                    background: rgba(15, 23, 42, 0.95);
                }
                .custom-popup .leaflet-popup-content {
                    margin: 0;
                }
            `}</style>
        </div>
    );
}
