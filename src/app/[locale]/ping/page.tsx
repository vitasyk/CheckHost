import { getTranslations } from 'next-intl/server';
import PingClient from '@/components/checks/PingClient';
import { PingContent } from '@/components/content/PingContent';
import { setRequestLocale } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Metadata' });

    return {
        title: t('pingTitle'),
        description: t('pingDesc'),
        alternates: {
            canonical: '/ping', // Next.js will construct full URL
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
