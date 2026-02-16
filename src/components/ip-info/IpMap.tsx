'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTheme } from 'next-themes';

// Fix Leaflet default icon issue in Next.js
const icon = L.icon({
    iconUrl: '/location-pin.png', // We'll need to grab a generic pin or use default
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: null as any,
    shadowSize: [41, 41]
});

// Since we don't have local assets yet, let's use CDN for marker icons or custom SVG
const customIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface IpMapProps {
    lat: number;
    lng: number;
    city: string;
    country: string;
}

function MapUpdater({ lat, lng }: { lat: number, lng: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng], 13);
    }, [lat, lng, map]);
    return null;
}

export default function IpMap({ lat, lng, city, country }: IpMapProps) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="h-full w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />;

    const isDark = theme === 'dark';
    const tileUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    return (
        <MapContainer
            center={[lat, lng]}
            zoom={13}
            scrollWheelZoom={false}
            className="h-full w-full z-0 transition-all duration-500"
            style={{ minHeight: '300px', height: '100%', borderRadius: '0.75rem' }}
        >
            <TileLayer
                key={theme} // Force re-render when theme changes to update tiles
                attribution={isDark
                    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
                url={tileUrl}
                className="map-tiles"
            />
            <Marker position={[lat, lng]} icon={customIcon}>
                <Popup>
                    <div className="text-center">
                        <span className="font-bold block">{city}</span>
                        <span className="text-xs text-slate-500">{country}</span>
                    </div>
                </Popup>
            </Marker>
            <MapUpdater lat={lat} lng={lng} />
        </MapContainer>
    );
}
