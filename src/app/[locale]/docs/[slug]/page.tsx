import { getTranslations } from 'next-intl/server';
import { Link, redirect } from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import { query } from '@/lib/postgres';
import { ChevronLeft, ChevronRight, Clock, BookOpen, List } from 'lucide-react';
import { generateAlternates } from '@/lib/seo-utils';
import { marked } from 'marked';

interface Article {
    id: number;
    slug: string;
    title: string;
    content: string;
    section: string;
    cover_image?: string;
    updated_at: Date;
    locale: string;
    translation_group?: string;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string, locale: string }> }) {
    const { slug, locale } = await params;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://checknode.io';

    try {
        const result = await query('SELECT title FROM docs_articles WHERE slug = $1 AND published = true', [slug]);
        if (result.rows.length === 0) return { title: 'Not Found' };

        return {
            title: `${result.rows[0].title} | Documentation`,
            alternates: generateAlternates(`docs/${slug}`, siteUrl, locale),
        };
    } catch (e) {
        return {
            title: 'Documentation',
            alternates: generateAlternates(`docs/${slug}`, siteUrl, locale),
        };
    }
}

async function findDocTranslation(slug: string, targetLocale: string): Promise<string | null> {
    try {
        console.log(`[DocsRedirect] Searching translation for slug: "${slug}" to locale: "${targetLocale}"`);

        const sourceRes = await query('SELECT * FROM docs_articles WHERE slug = $1 LIMIT 1', [slug]);
        const sourceDoc = sourceRes.rows[0] as Article;

        if (!sourceDoc) {
            console.log(`[DocsRedirect] No source article found for slug: "${slug}"`);
            return null;
        }

        console.log(`[DocsRedirect] Found source article ID: ${sourceDoc.id}, Locale: ${sourceDoc.locale}, Group: ${sourceDoc.translation_group}`);
        if (sourceDoc.locale === targetLocale) {
            console.log(`[DocsRedirect] Source article is already in target locale. Skipping redirect.`);
            return null;
        }

        let translatedDoc: { slug: string } | null = null;

        if (sourceDoc.translation_group) {
            console.log(`[DocsRedirect] Trying by translation_group: ${sourceDoc.translation_group}`);
            const res = await query(
                'SELECT slug FROM docs_articles WHERE translation_group = $1 AND locale = $2 AND published = true LIMIT 1',
                [sourceDoc.translation_group, targetLocale]
            );
            translatedDoc = res.rows[0];
        }

        if (!translatedDoc && sourceDoc.cover_image) {
            console.log(`[DocsRedirect] Trying by cover_image: ${sourceDoc.cover_image}`);
            const res = await query(
                'SELECT slug FROM docs_articles WHERE cover_image = $1 AND locale = $2 AND published = true LIMIT 1',
                [sourceDoc.cover_image, targetLocale]
            );
            translatedDoc = res.rows[0];
        }

        // Final Fallback: Fuzzy Match by Root Slug
        if (!translatedDoc) {
            const rootSlug = slug.replace(/-[a-z]{2}$/, '');
            console.log(`[DocsRedirect] Trying fuzzy match by root slug: "${rootSlug}%"`);
            const res = await query(
                'SELECT slug FROM docs_articles WHERE slug ILIKE $1 AND locale = $2 AND published = true LIMIT 1',
                [`${rootSlug}%`, targetLocale]
            );
            translatedDoc = res.rows[0];
        }

        if (translatedDoc) {
            console.log(`[DocsRedirect] Success! Found translated doc slug: "${translatedDoc.slug}"`);
            return translatedDoc.slug;
        }

        console.log(`[DocsRedirect] No translation found for doc "${slug}" in "${targetLocale}"`);
        return null;
    } catch (e) {
        console.error('[DocsRedirect] Error finding translation:', e);
        return null;
    }
}

export default async function DocArticlePage({ params }: { params: Promise<{ slug: string, locale: string }> }) {
    const { slug, locale } = await params;
    const t = await getTranslations('Docs');

    let article: Article | null = null;
    let otherArticles: { title: string, slug: string, section: string }[] = [];

    try {
        const result = await query('SELECT * FROM docs_articles WHERE slug = $1 AND published = true AND locale = $2 LIMIT 1', [slug, locale]);

        if (result.rows.length === 0) {
            const newSlug = await findDocTranslation(slug, locale);
            if (newSlug) {
                redirect({ href: `/docs/${newSlug}`, locale });
            }
            notFound();
        }

        article = result.rows[0];

        const allResult = await query(
            'SELECT title, slug, section FROM docs_articles WHERE published = true AND locale = $1 ORDER BY section ASC, order_index ASC',
            [locale]
        );
        otherArticles = allResult.rows;
    } catch (e) {
        console.error('Error fetching article:', e);
        if ((e as any).digest?.startsWith('NEXT_REDIRECT')) throw e;
        notFound();
    }

    if (!article) notFound();

    const trimmedContent = article.content.trim();
    const isHtml = /^<[a-z][\s\S]*>$/i.test(trimmedContent);
    const htmlContent = isHtml ? trimmedContent : await marked(trimmedContent);
    const sections = Array.from(new Set(otherArticles.map(a => a.section)));

    return (
        <div className="min-h-screen bg-white dark:bg-[#0B0F1A]">
            <div className="container mx-auto px-4 py-8 md:py-16">
                <div className="flex flex-col lg:flex-row gap-12">

                    {/* Left Sidebar - Navigation */}
                    <aside className="lg:w-64 flex-shrink-0 hidden lg:block">
                        <div className="sticky top-24 space-y-8">
                            <Link
                                href="/docs"
                                className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-500 transition-colors mb-8"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                {t('backToDocs')}
                            </Link>

                            {sections.map(sectionName => (
                                <div key={sectionName} className="space-y-3">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3">
                                        {t(`sections.${sectionName}`) || sectionName}
                                    </h3>
                                    <nav className="space-y-1">
                                        {otherArticles
                                            .filter(a => a.section === sectionName)
                                            .map(a => (
                                                <Link
                                                    key={a.slug}
                                                    href={`/docs/${a.slug}`}
                                                    className={`block px-3 py-2 text-sm rounded-lg transition-colors ${a.slug === slug
                                                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium'
                                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                                                        }`}
                                                >
                                                    {a.title}
                                                </Link>
                                            ))}
                                    </nav>
                                </div>
                            ))}
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 max-w-4xl">
                        <div className="mb-8 flex items-center gap-4 text-sm text-slate-500">
                            <h2 className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-white/5 font-medium text-slate-700 dark:text-slate-300 text-sm">
                                {t('title')}: {t(`sections.${article.section}`) || article.section}
                            </h2>
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                {t('lastUpdated')}: {new Date(article.updated_at).toLocaleDateString(locale)}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-8">
                            {article.title}
                        </h1>

                        {article.cover_image && (
                            <div className="mb-10 rounded-2xl overflow-hidden aspect-video border border-slate-200 dark:border-white/10 shadow-xl bg-slate-100 dark:bg-slate-800">
                                <img src={article.cover_image} alt={article.title} width={800} height={450} className="w-full h-full object-cover" />
                            </div>
                        )}

                        {/* Робимо заголовок видимим для SEO: видалено для уникнення попереджень про загальні заголовки H2 */}
                        <div
                            className="prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-24 prose-pre:bg-slate-900 prose-pre:p-0 prose-code:text-blue-600 dark:prose-code:text-blue-400 prose-a:text-blue-600 dark:prose-a:text-blue-400"
                            dangerouslySetInnerHTML={{ __html: htmlContent }}
                        />

                        {/* Pagination Bottom */}
                        <div className="mt-16 pt-8 border-t border-slate-200 dark:border-white/5 flex flex-col sm:flex-row justify-between gap-4">
                            <Link
                                href="/docs"
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-500 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                {t('backToDocs')}
                            </Link>
                        </div>
                    </main>

                    {/* Right Sidebar - TOC or Meta (Optional) */}
                    <aside className="lg:w-48 hidden xl:block">
                        {/* Could add TOC here later */}
                    </aside>
                </div>
            </div>
        </div>
    );
}
