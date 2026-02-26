import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { ChecksClient } from '@/components/checks/ChecksClient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Metadata' });

    return {
        title: t('checksTitle') || `Diagnostic Tools | ${process.env.NEXT_PUBLIC_SITE_NAME || 'CheckHost.top'}`,
        description: t('checksDesc') || 'Comprehensive website diagnostic tools including Ping, HTTP, DNS, SSL, and MTR checks.',
        alternates: {
            canonical: '/',
        },
    };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <div className="flex flex-col min-h-full">
            <ChecksClient />
        </div>
    );
}
