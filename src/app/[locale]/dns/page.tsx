import { getTranslations } from 'next-intl/server';
import { generateAlternates } from '@/lib/seo-utils';
import DnsClient from '@/components/checks/DnsClient';
import { DnsContent } from '@/components/content/DnsContent';
import { setRequestLocale } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Metadata' });
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://checknode.io';

    return {
        title: t('dnsTitle'),
        description: t('dnsDesc'),
        alternates: generateAlternates('dns', siteUrl, locale),
        openGraph: {
            title: t('dnsTitle'),
            description: t('dnsDesc'),
            url: `${siteUrl}/dns`,
            siteName: t('siteName'),
            locale: locale,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: t('dnsTitle'),
            description: t('dnsDesc'),
        },
    };
}

export default async function DnsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <div className="flex flex-col min-h-full">
            <DnsClient />
            <DnsContent />
        </div>
    );
}
