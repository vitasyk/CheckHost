import { getTranslations } from 'next-intl/server';
import { generateAlternates } from '@/lib/seo-utils';
import PingClient from '@/components/checks/PingClient';
import { PingContent } from '@/components/content/PingContent';
import { setRequestLocale } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Metadata' });
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    return {
        title: t('pingTitle'),
        description: t('pingDesc'),
        alternates: generateAlternates('ping', siteUrl),
        openGraph: {
            title: t('pingTitle'),
            description: t('pingDesc'),
            url: `${siteUrl}/ping`,
            siteName: t('siteName'),
            locale: locale,
            type: 'website',
        },
    };
}

export default async function PingPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <div className="flex flex-col min-h-full">
            <PingClient />
            <PingContent />
        </div>
    );
}
