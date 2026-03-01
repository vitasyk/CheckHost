import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { ChecksClient } from '@/components/checks/ChecksClient';
import { HomePageSeoBlock } from '@/components/HomePageSeoBlock';
import { ToolSeoBlock } from '@/components/content/ToolSeoBlock';
import { ToolFaqBlock } from '@/components/content/ToolFaqBlock';
import { Suspense } from 'react';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Metadata' });

    return {
        title: t('checksTitle') || `Diagnostic Tools | ${process.env.NEXT_PUBLIC_SITE_NAME || 'CheckNode'}`,
        description: t('checksDesc') || 'Comprehensive website diagnostic tools including Ping, HTTP, DNS, SSL, and MTR checks.',
        alternates: {
            canonical: '/',
        },
    };
}

export default async function HomePage({
    params,
    searchParams
}: {
    params: Promise<{ locale: string }>,
    searchParams: Promise<{ tab?: string }>
}) {
    const { locale } = await params;
    const { tab } = await searchParams;
    setRequestLocale(locale);

    // If a specific tool tab is selected (other than 'info' which is the default home tab),
    // we show the professional ToolSeoBlock.
    const showToolSeo = tab && tab !== 'info';

    return (
        <div className="flex flex-col min-h-full">
            <ChecksClient />
            {showToolSeo ? (
                <Suspense fallback={null}>
                    <ToolSeoBlock toolId={tab} />
                    <ToolFaqBlock toolId={tab} locale={locale} />
                </Suspense>
            ) : (
                <HomePageSeoBlock />
            )}
        </div>
    );
}
