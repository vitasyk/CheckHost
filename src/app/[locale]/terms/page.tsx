import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateAlternates } from '@/lib/seo-utils';
import { FileText } from 'lucide-react';
import React from 'react';
import { SafeEmail } from '@/components/common/SafeEmail';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'CheckNode';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://checknode.io';
    return {
        title: `Terms of Service & Acceptable Use Policy`,
        description: `Review the Terms of Service and Acceptable Use Policy for ${siteName}. Learn about your rights, responsibilities, and our network diagnostic guidelines.`,
        alternates: generateAlternates('terms', siteUrl, locale),
    };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'Legal' });
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'CheckNode';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://checknode.io';

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-16">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl">
                    <FileText className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">{t('termsTitle')}</h1>
            </div>
            <p className="text-slate-500 mb-8 text-sm">{t('lastUpdated', { date: 'February 27, 2026' })}</p>

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">

                <section>
                    <h2>{t('termsAcceptanceTitle')}</h2>
                    <p>{t('termsAcceptanceDesc', { siteName, siteUrl })}</p>
                </section>

                <section>
                    <h2>{t('termsServiceDesc')}</h2>
                    <p>{t('serviceDescText', { siteName })}</p>
                    <ul>
                        <li>{t('serviceFeature1')}</li>
                        <li>{t('serviceFeature2')}</li>
                        <li>{t('serviceFeature3')}</li>
                        <li>{t('serviceFeature4')}</li>
                    </ul>
                </section>

                <section>
                    <h2>{t('acceptableUseTitle')}</h2>
                    <p>{t('acceptableUseDesc')}</p>
                    <ul>
                        <li>{t('prohibited1')}</li>
                        <li>{t('prohibited2')}</li>
                        <li>{t('prohibited3')}</li>
                        <li>{t('prohibited4')}</li>
                    </ul>
                </section>

                <section>
                    <h2>{t('disclaimerTitle')}</h2>
                    <p>{t('disclaimerDesc', { siteName })}</p>
                </section>

                <section>
                    <h2>{t('limitationLiabilityTitle')}</h2>
                    <p>{t('limitationLiabilityDesc', { siteName })}</p>
                </section>

                <section>
                    <h2>{t('intellectualPropertyTitle')}</h2>
                    <p>{t('intellectualPropertyDesc', { siteName })}</p>
                </section>

                <section>
                    <h2>{t('terminationTitle')}</h2>
                    <p>{t('terminationDesc', { siteName })}</p>
                </section>

                <section>
                    <h2>{t('governingLawTitle')}</h2>
                    <p>{t('governingLawDesc')}</p>
                </section>

                <section>
                    <h2>{t('changesTitle')}</h2>
                    <p>{t('changesDesc', { siteName })}</p>
                </section>

                <section>
                    <h2>{t('contactUsTitle')}</h2>
                    <p>
                        {t('termsContactDesc', { email: 'EMAIL_PLACEHOLDER' }).split('EMAIL_PLACEHOLDER').map((part, i, arr) => (
                            <React.Fragment key={i}>
                                {part}
                                {i < arr.length - 1 && (
                                    <SafeEmail email={`support@${new URL(siteUrl).hostname}`} />
                                )}
                            </React.Fragment>
                        ))}
                    </p>
                </section>

            </div>
        </div>
    );
}
