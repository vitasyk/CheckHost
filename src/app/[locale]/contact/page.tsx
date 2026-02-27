import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Mail, MessageSquare, Clock, Globe } from 'lucide-react';
import { Card } from '@/components/ui/card';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'CheckNode';
    return {
        title: `Contact Us | ${siteName}`,
        description: `Get in touch with the ${siteName} team. We're happy to help.`,
        alternates: { canonical: '/contact' },
    };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'Legal' });
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'CheckNode';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://checknode.io';
    const supportEmail = `support@${new URL(siteUrl).hostname}`;
    const abuseEmail = `abuse@${new URL(siteUrl).hostname}`;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-16">
            <div className="mb-12 text-center">
                <div className="inline-flex p-3 bg-purple-100 dark:bg-purple-500/10 rounded-2xl mb-4">
                    <MessageSquare className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-3">{t('contactTitle')}</h1>
                <p className="text-slate-500 max-w-xl mx-auto">{t('contactSubtitle', { siteName })}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
                <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                            <Mail className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{t('generalSupport')}</h3>
                            <p className="text-slate-500 text-sm mb-2">{t('generalSupportDesc')}</p>
                            <a href={`mailto:${supportEmail}`} className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline text-sm">
                                {supportEmail}
                            </a>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg">
                            <Globe className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{t('abuseReports')}</h3>
                            <p className="text-slate-500 text-sm mb-2">{t('abuseReportsDesc')}</p>
                            <a href={`mailto:${abuseEmail}`} className="text-rose-600 dark:text-rose-400 font-medium hover:underline text-sm">
                                {abuseEmail}
                            </a>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50 mb-8">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                        <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{t('responseTime')}</h3>
                        <p className="text-slate-500 text-sm">{t('responseTimeDesc')}</p>
                    </div>
                </div>
            </Card>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-white/5">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">{t('beforeContactingTitle')}</h2>
                <ul className="space-y-2 text-slate-500 text-sm">
                    <li>• {t('beforeContacting1')}</li>
                    <li>• {t('beforeContacting2', { link: '/about' })}</li>
                    <li>• {t('beforeContacting3', { link: '/blog' })}</li>
                </ul>
            </div>
        </div>
    );
}
