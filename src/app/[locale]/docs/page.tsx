import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { query } from '@/lib/postgres';
import { Card } from '@/components/ui/card';
import { BookOpen, ChevronRight } from 'lucide-react';

interface DocArticle {
    id: number;
    slug: string;
    title: string;
    section: string;
    order_index: number;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const t = await getTranslations('Docs');
    return {
        title: `${t('title')} | CheckNode`,
        description: t('subtitle'),
    };
}

export default async function DocsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations('Docs');

    let articles: DocArticle[] = [];
    try {
        const result = await query(`
            SELECT id, slug, title, section, order_index 
            FROM docs_articles 
            WHERE published = true AND locale = $1
            ORDER BY section ASC, order_index ASC
        `, [locale]);
        articles = result.rows;
    } catch (e) {
        console.error('Error fetching docs:', e);
    }

    const sections = Array.from(new Set(articles.map(a => a.section)));

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F1A] pb-20">
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24 border-b border-slate-200 dark:border-white/5">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-blue-500/10 to-transparent blur-3xl pointer-events-none" />

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-6 border border-blue-500/20">
                        <BookOpen className="w-3 h-3" />
                        <span>CHECKNODE KNOWLEDGE BASE</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">
                        {t('title')}
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        {t('subtitle')}
                    </p>
                </div>
            </section>

            <div className="container mx-auto px-4 py-16">
                {articles.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 mb-4">
                            <BookOpen className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500">{t('noArticles')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {sections.map(section => (
                            <div key={section} className="space-y-6">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                                    {t(`sections.${section}`) || section}
                                </h2>
                                <div className="space-y-4">
                                    {articles
                                        .filter(a => a.section === section)
                                        .map(article => (
                                            <Link
                                                key={article.id}
                                                href={`/docs/${article.slug}`}
                                                className="block transition-transform hover:-translate-y-1"
                                            >
                                                <Card className="p-5 border-slate-200 dark:border-white/5 bg-white dark:bg-white/5 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-colors shadow-sm hover:shadow-md group">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                                                            {article.title}
                                                        </span>
                                                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                                    </div>
                                                </Card>
                                            </Link>
                                        ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
