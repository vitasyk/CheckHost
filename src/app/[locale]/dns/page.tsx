import { getTranslations } from 'next-intl/server';
import DnsClient from '@/components/checks/DnsClient';
import { DnsContent } from '@/components/content/DnsContent';
import { setRequestLocale } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Metadata' });

    return {
        title: t('dnsTitle'),
        description: t('dnsDesc'),
        alternates: {
            canonical: '/dns',
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
