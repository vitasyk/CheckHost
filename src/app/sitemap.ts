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
    const staticPages = locales.flatMap((locale) => [
        {
            url: getLocalizedUrl('', locale) || baseUrl, // handles root
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 1.0,
        },
        {
            url: getLocalizedUrl('/checks', locale),
            lastModified: new Date(),
            changeFrequency: 'always' as const,
            priority: 0.9,
        },
        {
            url: getLocalizedUrl('/blog', locale),
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.8,
        },
        {
            url: getLocalizedUrl('/ping', locale),
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.9,
        },
        {
            url: getLocalizedUrl('/http', locale),
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.9,
        },
        {
            url: getLocalizedUrl('/dns', locale),
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.9,
        },
        {
            url: getLocalizedUrl('/ip-info', locale),
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.9,
        }
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
    try {
        if (isSupabaseConfigured) {
            const { data } = await supabase
                .from('seo_pages')
                .select('host, tool, last_checked')
                .order('check_count', { ascending: false })
                .limit(5000); // 5000 * 9 = 45k total, keeps us under 50k limit
            if (data) seoPages = data;
        } else if (isPostgresConfigured) {
            const result = await pool.query(
                "SELECT host, tool, last_checked FROM seo_pages ORDER BY check_count DESC LIMIT 5000"
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
