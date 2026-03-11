import { getSnapshot } from '@/lib/snapshot';
import { notFound } from 'next/navigation';
import { ShareClient } from './ShareClient';
import { setRequestLocale } from 'next-intl/server';
import { generateAlternates } from '@/lib/seo-utils';

export async function generateMetadata({ params }: { params: Promise<{ id: string, locale: string }> }) {
    const { id, locale } = await params;
    const snapshot = await getSnapshot(id);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://checknode.io';

    if (!snapshot || snapshot.isExpired) {
        return {
            title: 'Snapshot Not Found | CheckNode',
        };
    }

    return {
        title: `${snapshot.target_host} - Global ${snapshot.check_type.toUpperCase()} Snapshot | CheckNode`,
        description: `View shared ${snapshot.check_type} results for ${snapshot.target_host}. Captured on CheckNode - Global Network Diagnostics.`,
        alternates: generateAlternates(`share/${id}`, siteUrl, locale),
    };
}

export default async function SharePage({ params }: { params: Promise<{ id: string, locale: string }> }) {
    const { id, locale } = await params;
    setRequestLocale(locale);

    const snapshot = await getSnapshot(id);

    if (!snapshot) {
        notFound();
    }

    if (snapshot.isExpired) {
        return <ShareClient snapshot={snapshot} error="Snapshot expired" />;
    }

    return <ShareClient snapshot={snapshot} />;
}
