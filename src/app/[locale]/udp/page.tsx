import { getTranslations } from 'next-intl/server';
import { generateAlternates } from '@/lib/seo-utils';
import { setRequestLocale } from 'next-intl/server';
import { ChecksClient } from '@/components/checks/ChecksClient';
import { UdpContent } from '@/components/content/UdpContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Metadata' });
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://checknode.io';

    return {
        title: t('udpTitle'),
        description: t('udpDesc'),
        alternates: generateAlternates('udp', siteUrl, locale),
    };
}

export default async function UdpPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <div className="flex flex-col min-h-full">
            <ChecksClient initialTab="udp" />
            <UdpContent />
        </div>
    );
}
