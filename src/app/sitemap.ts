import { MetadataRoute } from 'next';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import pool, { isPostgresConfigured } from '@/lib/postgres';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://checknode.io';

    const locales = ['en', 'uk', 'es', 'de', 'fr', 'ru', 'nl', 'pl', 'it'];
    const defaultLocale = 'en';

    function getLocalizedUrl(path: string, locale: string) {
        const prefix = locale === defaultLocale ? '' : `/${locale}`;
        return `${baseUrl}${prefix}${path}`;
    }

    // Static pages across all locales
    const toolPages = [
        { path: '/ping', priority: 0.9 },
        { path: '/http', priority: 0.9 },
        { path: '/dns', priority: 0.9 },
        { path: '/ip-info', priority: 0.9 },
        { path: '/smtp', priority: 0.9 },
        { path: '/ssl', priority: 0.9 },
        { path: '/mtr', priority: 0.8 },
        { path: '/tcp', priority: 0.8 },
        { path: '/udp', priority: 0.8 },
    ];

    const infoPages = [
        { path: '/blog', priority: 0.8 },
        { path: '/docs', priority: 0.8 },
        { path: '/faq', priority: 0.75 },
        { path: '/about', priority: 0.6 },
        { path: '/contact', priority: 0.5 },
        { path: '/privacy', priority: 0.4 },
        { path: '/terms', priority: 0.4 },
    ];

    const staticPages = locales.flatMap((locale) => [
        {
            url: getLocalizedUrl('', locale) || baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 1.0,
        },
        ...toolPages.map((p) => ({
            url: getLocalizedUrl(p.path, locale),
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: p.priority,
        })),
        ...infoPages.map((p) => ({
            url: getLocalizedUrl(p.path, locale),
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: p.priority,
        })),
    ]);


    // Dynamic blog posts across all locales
    let blogPosts: any[] = [];
    try {
        if (isSupabaseConfigured) {
            const { data } = await supabase
                .from('posts')
                .select('slug, published_at')
                .eq('status', 'published');
            if (data) blogPosts = data;
        } else if (isPostgresConfigured) {
            const result = await pool.query(
                "SELECT slug, published_at FROM posts WHERE status = 'published'"
            );
            blogPosts = result.rows;
        }
    } catch (error) {
        console.error('Sitemap: Failed to fetch blog posts:', error);
    }

    const blogPageEntries = blogPosts.flatMap((post) =>
        locales.map((locale) => ({
            url: getLocalizedUrl(`/blog/${post.slug}`, locale),
            lastModified: new Date(post.published_at),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }))
    );

    // Dynamic SEO tools pages across all locales
    let seoPages: any[] = [];
    const maxSeoUrls = 45000;
    const limitPerPage = Math.floor(maxSeoUrls / locales.length);

    try {
        if (isSupabaseConfigured) {
            const { data } = await supabase
                .from('seo_pages')
                .select('host, tool, last_checked')
                .order('check_count', { ascending: false })
                .limit(limitPerPage);
            if (data) seoPages = data;
        } else if (isPostgresConfigured) {
            const result = await pool.query(
                `SELECT host, tool, last_checked FROM seo_pages ORDER BY check_count DESC LIMIT ${limitPerPage}`
            );
            seoPages = result.rows;
        }
    } catch (error) {
        console.error('Sitemap: Failed to fetch SEO pages:', error);
    }

    const seoPageEntries = seoPages.flatMap((page) =>
        locales.map((locale) => ({
            url: getLocalizedUrl(`/report/${page.tool}/${encodeURIComponent(page.host)}`, locale),
            lastModified: new Date(page.last_checked),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
        }))
    );

    return [...staticPages, ...blogPageEntries, ...seoPageEntries].filter((entry, index, self) =>
        index === self.findIndex((t) => t.url === entry.url)
    );
}
