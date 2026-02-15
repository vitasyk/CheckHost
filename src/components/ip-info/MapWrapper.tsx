'use client';

import dynamic from 'next/dynamic';

const IpMap = dynamic(() => import('@/components/ip-info/IpMap'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl flex items-center justify-center text-muted-foreground text-sm">Loading Map...</div>
});

interface MapWrapperProps {
    lat: number;
    lng: number;
    city: string;
    country: string;
}

export default function MapWrapper(props: MapWrapperProps) {
    return <IpMap {...props} />;
}
