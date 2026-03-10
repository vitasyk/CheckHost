import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateAlternates } from '@/lib/seo-utils';
import { Shield } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'CheckNode';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://checknode.io';
    return {
        title: `Privacy Policy - Data Protection & Security | ${siteName}`,
        description: `Privacy Policy for ${siteName} - Learn how we collect and use your data.`,
        alternates: generateAlternates('privacy', siteUrl, locale),
        openGraph: {
            title: `Privacy Policy - Data Protection & Security | ${siteName}`,
            description: `Read the ${siteName} Privacy Policy to understand how we collect, use, and protect your personal data and network diagnostic information securely.`,
            url: `${siteUrl}/privacy`,
            siteName: siteName,
            locale: locale,
            type: 'website',
        },
    };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'Legal' });
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'CheckNode';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://checknode.io';

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-16">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-500/10 rounded-xl">
                    <Shield className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">{t('privacyTitle')}</h1>
            </div>
            <p className="text-slate-500 mb-8 text-sm">{t('lastUpdated', { date: 'February 27, 2026' })}</p>

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">

                <section>
                    <h2>{t('privacyIntroTitle')}</h2>
                    <p>{t('privacyIntro', { siteName, siteUrl })}</p>
                </section>

                <section>
                    <h2>{t('informationWeCollectTitle')}</h2>
                    <h3>{t('automaticallyCollectedTitle')}</h3>
                    <ul>
                        <li>{t('autoCollect1')}</li>
                        <li>{t('autoCollect2')}</li>
                        <li>{t('autoCollect3')}</li>
                        <li>{t('autoCollect4')}</li>
                    </ul>
                    <h3>{t('providedByYouTitle')}</h3>
                    <ul>
                        <li>{t('userProvided1')}</li>
                        <li>{t('userProvided2')}</li>
                    </ul>
                </section>

                <section>
                    <h2>{t('cookiesTitle')}</h2>
                    <p>{t('cookiesDesc')}</p>
                    <ul>
                        <li><strong>{t('cookieEssential')}:</strong> {t('cookieEssentialDesc')}</li>
                        <li><strong>{t('cookieAnalytics')}:</strong> {t('cookieAnalyticsDesc')}</li>
                        <li><strong>{t('cookieAdvertising')}:</strong> {t('cookieAdvertisingDesc')}</li>
                    </ul>
                    <p>{t('cookiesGoogleNote')}</p>
                </section>

                <section>
                    <h2>{t('howWeUseTitle')}</h2>
                    <ul>
                        <li>{t('howWeUse1')}</li>
                        <li>{t('howWeUse2')}</li>
                        <li>{t('howWeUse3')}</li>
                        <li>{t('howWeUse4')}</li>
                    </ul>
                </section>

                <section>
                    <h2>{t('thirdPartyTitle')}</h2>
                    <ul>
                        <li><strong>Infrastructure:</strong> {t('thirdPartyAdsense')}</li>
                        <li><strong>Infrastructure:</strong> {t('thirdPartyCloudflare')}</li>
                        <li><strong>Analytics:</strong> {t('thirdPartyAnalytics')}</li>
                    </ul>
                </section>

                <section>
                    <h2>{t('dataRetentionTitle')}</h2>
                    <p>{t('dataRetentionDesc')}</p>
                </section>

                <section>
                    <h2>{t('yourRightsTitle')}</h2>
                    <p>{t('yourRightsDesc')}</p>
                    <ul>
                        <li>{t('right1')}</li>
                        <li>{t('right2')}</li>
                        <li>{t('right3')}</li>
                        <li>{t('right4')}</li>
                    </ul>
                </section>

                <section>
                    <h2>{t('childrenTitle')}</h2>
                    <p>{t('childrenDesc')}</p>
                </section>

                <section>
                    <h2>{t('contactUsTitle')}</h2>
                    <p>{t('privacyContactDesc', { email: `support@${new URL(siteUrl).hostname}` })}</p>
                </section>

            </div>
        </div>
    );
}
