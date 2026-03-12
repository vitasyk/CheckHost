import { getTranslations } from 'next-intl/server';
import { generateAlternates } from '@/lib/seo-utils';
import { query } from '@/lib/postgres';
import { FaqAccordion } from '@/components/common/FaqAccordion';
import { HelpCircle } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { JsonLd } from '@/components/SEO/JsonLd';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'FAQ' });
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://checknode.io';
    return {
        title: `${t('title')} - Help & Support Center`,
        description: t('subtitle'),
        alternates: generateAlternates('faq', siteUrl, locale),
        openGraph: {
            title: `${t('title')} - Help & Support Center`,
            description: t('subtitle'),
            url: `${siteUrl}/faq`,
        },
    };
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'FAQ' });

    let faqs = [];
    try {
        const result = await query(`
            SELECT id, title, content, order_index
            FROM docs_articles
            WHERE section = 'faq' AND published = true AND locale = $1
            ORDER BY order_index ASC
        `, [locale]);

        // If no FAQs for current locale, fallback to English
        if (result.rows.length === 0 && locale !== 'en') {
            const fallback = await query(`
                SELECT id, title, content, order_index
                FROM docs_articles
                WHERE section = 'faq' AND published = true AND locale = 'en'
                ORDER BY order_index ASC
            `);
            faqs = fallback.rows;
        } else {
            faqs = result.rows;
        }
    } catch (e) {
        console.error('Failed to fetch FAQs:', e);
    }

    const accordionItems = faqs.map(faq => ({
        id: faq.id,
        question: faq.title,
        answer: faq.content
    }));

    const faqJsonLd = accordionItems.length > 0 ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": accordionItems.map(item => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer?.replace(/<[^>]*>/g, '').substring(0, 500) || ''
            }
        }))
    } : null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F1A] pb-20">
            {faqJsonLd && <JsonLd data={faqJsonLd} />}
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24 border-b border-slate-200 dark:border-white/5">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-indigo-500/10 to-transparent blur-3xl pointer-events-none" />

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-6 border border-indigo-500/20">
                        <HelpCircle className="w-3 h-3" />
                        <span>KNOWLEDGE BASE</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">
                        {t('title')}
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-normal">
                        {t('subtitle')}
                    </p>
                </div>
            </section>

            <div className="container mx-auto px-4 py-8">
                {accordionItems.length > 0 ? (
                    <FaqAccordion items={accordionItems} title={t('title')} headingLevel="h3" />
                ) : (
                    <div className="text-center py-20 text-slate-500">
                        {t('noFaqs')}
                    </div>
                )}
            </div>

            {/* Extended SEO Content Section */}
            <section className="container mx-auto px-4 pt-8 pb-16">
                <div className="max-w-4xl mx-auto border-t border-slate-200 dark:border-white/5 pt-16">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="md:col-span-2 space-y-6">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {t('extendedTitle')}
                            </h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 leading-relaxed">
                                <p>{t('extendedP1')}</p>
                                <p>{t('extendedP2')}</p>
                                <p>{t('extendedP3')}</p>
                            </div>
                        </div>
                        <div className="bg-indigo-500/5 dark:bg-indigo-500/10 rounded-3xl p-8 border border-indigo-500/10 h-fit">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                {t('stillHaveQuestions')}
                            </h3>
                            <Link
                                href="/contact"
                                className="inline-flex items-center justify-center w-full px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-all duration-300 shadow-lg shadow-indigo-500/25"
                            >
                                Contact Support
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
