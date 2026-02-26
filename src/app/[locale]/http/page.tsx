import { getTranslations } from 'next-intl/server';
import HttpClient from '@/components/checks/HttpClient';
import { HttpContent } from '@/components/content/HttpContent';
import { setRequestLocale } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Metadata' });

    return {
        title: t('httpTitle'),
        description: t('httpDesc'),
        alternates: {
            canonical: '/http',
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
