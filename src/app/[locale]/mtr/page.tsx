import { getTranslations } from 'next-intl/server';
import { generateAlternates } from '@/lib/seo-utils';
import { setRequestLocale } from 'next-intl/server';
import { ChecksClientNoSsr } from '@/components/checks/ChecksClientNoSsr';
import { MtrContent } from '@/components/content/MtrContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Metadata' });
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://checknode.io';

    return {
        title: t('mtrTitle'),
        description: t('mtrDesc'),
        alternates: generateAlternates('mtr', siteUrl, locale),
        openGraph: {
            title: t('mtrTitle'),
            description: t('mtrDesc'),
            url: `${siteUrl}/mtr`,
            siteName: t('siteName'),
            locale: locale,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: t('mtrTitle'),
            description: t('mtrDesc'),
        },
    };
}

export default async function MtrPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <div className="flex flex-col min-h-full">
            <ChecksClientNoSsr initialTab="mtr" />
            <MtrContent />
        </div>
    );
}
