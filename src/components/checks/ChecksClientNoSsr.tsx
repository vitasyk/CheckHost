'use client';

import dynamic from 'next/dynamic';

// Dynamic import with ssr:false must live inside a Client Component.
// This wrapper prevents Radix UI hydration mismatches caused by auto-generated IDs.
const ChecksClientInner = dynamic(
    () => import('./ChecksClient').then(mod => mod.ChecksClient),
    { ssr: false, loading: () => <div className="min-h-[400px]" /> }
);

interface ChecksClientProps {
    initialHost?: string;
    initialTab?: string;
    autoStart?: boolean;
}

export function ChecksClientNoSsr(props: ChecksClientProps) {
    return <ChecksClientInner {...props} />;
}
