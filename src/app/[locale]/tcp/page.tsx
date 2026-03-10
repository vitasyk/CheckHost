import { getTranslations } from 'next-intl/server';
import { generateAlternates } from '@/lib/seo-utils';
import { setRequestLocale } from 'next-intl/server';
import { ChecksClient } from '@/components/checks/ChecksClient';
import { TcpContent } from '@/components/content/TcpContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Metadata' });
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://checknode.io';

    return {
        title: t('tcpTitle'),
        description: t('tcpDesc'),
        alternates: generateAlternates('tcp', siteUrl, locale),
        openGraph: {
            title: t('tcpTitle'),
            description: t('tcpDesc'),
            url: `${siteUrl}/tcp`,
            siteName: t('siteName'),
            locale: locale,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: t('tcpTitle'),
            description: t('tcpDesc'),
        },
    };
}

export default async function TcpPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <div className="flex flex-col min-h-full">
            <ChecksClient initialTab="tcp" />
            <TcpContent />
        </div>
    );
}
