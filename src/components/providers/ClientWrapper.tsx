'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const GlobalAdEditorModal = dynamic(() => import("@/components/admin/GlobalAdEditorModal").then(mod => mod.GlobalAdEditorModal), {
    ssr: false,
});

const CookieConsent = dynamic(() => import("@/components/CookieConsent").then(mod => mod.CookieConsent), {
    ssr: false,
});

export function ClientWrapper() {
    return (
        <>
            <Suspense fallback={null}>
                <GlobalAdEditorModal />
            </Suspense>
            <Suspense fallback={null}>
                <CookieConsent />
            </Suspense>
        </>
    );
}
