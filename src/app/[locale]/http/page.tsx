import { getTranslations } from 'next-intl/server';
import { generateAlternates } from '@/lib/seo-utils';
import HttpClient from '@/components/checks/HttpClient';
import { HttpContent } from '@/components/content/HttpContent';
import { setRequestLocale } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Metadata' });
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://checknode.io';

    return {
        title: t('httpTitle'),
        description: t('httpDesc'),
        alternates: generateAlternates('http', siteUrl, locale),
        openGraph: {
            title: t('httpTitle'),
            description: t('httpDesc'),
            url: `${siteUrl}/http`,
            siteName: t('siteName'),
            locale: locale,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: t('httpTitle'),
            description: t('httpDesc'),
        },
    };
}

export default async function HttpPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <div className="flex flex-col min-h-full">
            <HttpClient />
            <HttpContent />
        </div>
    );
}
