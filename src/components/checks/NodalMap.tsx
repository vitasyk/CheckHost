'use client';

import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
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

// Icon factory for Apple-style nodes with integrated tooltips (avoids Leaflet jumping bug)
const createNodeIcon = (node: any, isSelected: boolean) => {
    const iconUrl = isSelected
        ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png'
        : 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';

    return L.divIcon({
        className: 'apple-node-icon',
        html: `
            <div class="marker-root ${isSelected ? 'is-selected' : ''}">
                <div class="marker-main">
                    <img src="${iconUrl}" class="marker-img" />
                </div>
                
                <div class="apple-glass-card">
                    <div class="card-top">
                        <span class="card-city">${node.city}, ${node.country}</span>
                        <span class="card-badge">${node.countryCode}</span>
                    </div>
                    <div class="card-divider"></div>
                    <div class="card-info">
                        <div class="info-row">
                            <span class="info-label">Node</span>
                            <span class="info-value">#${node.id}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">ASN</span>
                            <span class="info-value">${node.asn}</span>
                        </div>
                    </div>
                    ${isSelected ? `
                        <div class="card-footer-selected">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            <span>SELECTED</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
    });
};

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
                        icon={createNodeIcon(node, selectedNodeIds.includes(node.id))}
                        eventHandlers={{
                            click: () => onToggleNode(node.id),
                        }}
                    />
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
                .custom-tooltip {
                    background: rgba(255, 255, 255, 0.75);
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
                    backdrop-filter: saturate(180%) blur(20px);
                    -webkit-backdrop-filter: saturate(180%) blur(20px);
                    padding: 8px 10px;
                    color: inherit;
                    transition: opacity 0.2s ease, transform 0.2s ease;
                    pointer-events: none;
                }
                .dark .custom-tooltip {
                    background: rgba(15, 23, 42, 0.65);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
                }
                .leaflet-tooltip-top.custom-tooltip:before {
                    border-top-color: rgba(255, 255, 255, 0.75);
                    margin-bottom: -1px;
                }
                .apple-node-icon {
                    background: none !important;
                    border: none !important;
                }
                .marker-root {
                    position: relative;
                    width: 25px;
                    height: 41px;
                    display: flex;
                    justify-content: center;
                }
                .marker-img {
                    width: 25px;
                    height: 41px;
                    display: block;
                    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .marker-root:hover .marker-img {
                    transform: scale(1.1);
                }
                .is-selected .marker-img {
                    animation: markerPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                    filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.3));
                }
                
                /* Apple Glass Card - Integrated Tooltip */
                .apple-glass-card {
                    position: absolute;
                    bottom: 45px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 210px;
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(12px) saturate(180%);
                    -webkit-backdrop-filter: blur(12px) saturate(180%);
                    border: 1px solid rgba(255, 255, 255, 1);
                    border-radius: 14px;
                    padding: 12px;
                    box-shadow: 
                        0 4px 12px rgba(0, 0, 0, 0.08),
                        0 0 1px rgba(0, 0, 0, 0.1);
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.2s ease-out, transform 0.2s ease-out;
                    z-index: 5000;
                    visibility: hidden;
                }
                .dark .apple-glass-card {
                    background: rgba(30, 41, 59, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
                }
                .marker-root:hover .apple-glass-card {
                    opacity: 1;
                    visibility: visible;
                    transform: translateX(-50%) translateY(-5px);
                }
                
                .card-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 6px;
                }
                .card-city {
                    font-size: 13px;
                    font-weight: 800;
                    color: #1e293b;
                    letter-spacing: -0.02em;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .dark .card-city { color: #f1f5f9; }
                .card-badge {
                    font-size: 9px;
                    font-weight: 900;
                    background: rgba(0, 0, 0, 0.05);
                    padding: 2px 4px;
                    border-radius: 4px;
                    color: #64748b;
                }
                .dark .card-badge { background: rgba(255, 255, 255, 0.05); color: #94a3b8; }
                .card-divider {
                    height: 1px;
                    background: rgba(0, 0, 0, 0.05);
                    margin-bottom: 6px;
                }
                .dark .card-divider { background: rgba(255, 255, 255, 0.05); }
                .card-info {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 10px;
                    font-weight: 500;
                    color: #64748b;
                }
                .dark .info-row { color: #94a3b8; }
                .info-value { font-family: monospace; color: #334155; }
                .dark .info-value { color: #cbd5e1; }
                
                .card-footer-selected {
                    margin-top: 8px;
                    background: rgba(16, 185, 129, 0.1);
                    color: #059669;
                    font-size: 9px;
                    font-weight: 900;
                    letter-spacing: 0.05em;
                    padding: 4px;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                }
                .card-footer-selected svg { width: 10px; height: 10px; }

                @keyframes markerPop {
                    0% { transform: scale(0.6) translateY(10px); filter: brightness(1.5); }
                    50% { transform: scale(1.1) translateY(-6px); }
                    100% { transform: scale(1) translateY(0); filter: brightness(1); }
                }
            `}</style>
        </div>
    );
}
