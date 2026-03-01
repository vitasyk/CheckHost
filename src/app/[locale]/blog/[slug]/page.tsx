import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import pool, { isPostgresConfigured } from '@/lib/postgres';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import BlogPostClient from './BlogPostClient';
import { JsonLd } from '@/components/SEO/JsonLd';

interface Post {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    cover_image: string;
    author: string;
    published_at: string;
    ad_top: boolean;
    ad_bottom: boolean;
    status: string;
    created_at: string;
    locale: string;
    translation_group?: string;
}

async function getPost(slug: string, locale: string, isAdmin: boolean = false): Promise<Post | null> {
    try {
        if (isSupabaseConfigured) {
            let query = supabase
                .from('posts')
                .select('*')
                .eq('slug', slug)
                .eq('locale', locale);

            if (!isAdmin) {
                query = query.eq('status', 'published');
            }

            const { data } = await query.single();
            return data;
        }

        if (isPostgresConfigured) {
            const statusFilter = isAdmin ? '' : "AND status = 'published'";
            const result = await pool.query(
                `SELECT *
                 FROM posts 
                 WHERE slug = $1 AND locale = $2 ${statusFilter} LIMIT 1`,
                [slug, locale]
            );
            return result.rows[0] || null;
        }
    } catch (error) {
        console.error('Failed to fetch blog post for SEO:', error);
    }
    return null;
}

async function findTranslation(slug: string, targetLocale: string, isAdmin: boolean = false): Promise<string | null> {
    try {
        console.log(`[BlogRedirect] Searching translation for slug: "${slug}" to locale: "${targetLocale}" (Admin: ${isAdmin})`);

        // 1. Find the post that matched this slug in ANY locale
        let sourcePost: Post | null = null;
        if (isSupabaseConfigured) {
            const { data } = await supabase.from('posts').select('*').eq('slug', slug).limit(1).maybeSingle();
            sourcePost = data;
        } else if (isPostgresConfigured) {
            const res = await pool.query('SELECT * FROM posts WHERE slug = $1 LIMIT 1', [slug]);
            sourcePost = res.rows[0];
        }

        if (!sourcePost) {
            console.log(`[BlogRedirect] No source post found for slug: "${slug}"`);
            return null;
        }

        console.log(`[BlogRedirect] Found source post ID: ${sourcePost.id}, Locale: ${sourcePost.locale}, Group: ${sourcePost.translation_group}`);
        if (sourcePost.locale === targetLocale) {
            console.log(`[BlogRedirect] Source post is already in target locale. Skipping redirect.`);
            return null;
        }

        // 2. Find the version of this post in the target locale
        let translatedPost: { slug: string } | null = null;
        const statusFilter = isAdmin ? '' : "AND status = 'published'";

        // Try by translation_group first (best)
        if (sourcePost.translation_group) {
            console.log(`[BlogRedirect] Trying by translation_group: ${sourcePost.translation_group}`);
            if (isSupabaseConfigured) {
                const query = supabase.from('posts').select('slug').eq('translation_group', sourcePost.translation_group).eq('locale', targetLocale);
                const { data } = await (isAdmin ? query : query.eq('status', 'published')).limit(1).maybeSingle();
                translatedPost = data;
            } else if (isPostgresConfigured) {
                const res = await pool.query(
                    `SELECT slug FROM posts WHERE translation_group = $1 AND locale = $2 ${statusFilter} LIMIT 1`,
                    [sourcePost.translation_group, targetLocale]
                );
                translatedPost = res.rows[0];
            }
        }

        // Fallback: Try by cover_image (good for older posts)
        if (!translatedPost && sourcePost.cover_image) {
            console.log(`[BlogRedirect] Trying by cover_image: ${sourcePost.cover_image}`);
            if (isSupabaseConfigured) {
                const query = supabase.from('posts').select('slug').eq('cover_image', sourcePost.cover_image).eq('locale', targetLocale);
                const { data } = await (isAdmin ? query : query.eq('status', 'published')).limit(1).maybeSingle();
                translatedPost = data;
            } else if (isPostgresConfigured) {
                const res = await pool.query(
                    `SELECT slug FROM posts WHERE cover_image = $1 AND locale = $2 ${statusFilter} LIMIT 1`,
                    [sourcePost.cover_image, targetLocale]
                );
                translatedPost = res.rows[0];
            }
        }

        // Final Fallback: Fuzzy Match by Root Slug (remove -uk, -es, etc.)
        if (!translatedPost) {
            const rootSlug = slug.replace(/-[a-z]{2}$/, '');
            console.log(`[BlogRedirect] Trying fuzzy match by root slug: "${rootSlug}%"`);
            if (isSupabaseConfigured) {
                const query = supabase.from('posts').select('slug').ilike('slug', `${rootSlug}%`).eq('locale', targetLocale);
                const { data } = await (isAdmin ? query : query.eq('status', 'published')).limit(1).maybeSingle();
                translatedPost = data;
            } else if (isPostgresConfigured) {
                const res = await pool.query(
                    `SELECT slug FROM posts WHERE slug ILIKE $1 AND locale = $2 ${statusFilter} LIMIT 1`,
                    [`${rootSlug}%`, targetLocale]
                );
                translatedPost = res.rows[0];
            }
        }

        if (translatedPost) {
            console.log(`[BlogRedirect] Success! Found translated slug: "${translatedPost.slug}"`);
            return translatedPost.slug;
        }

        console.log(`[BlogRedirect] No translation found for "${slug}" in "${targetLocale}"`);
        return null;
    } catch (e) {
        console.error('[BlogRedirect] Error finding translation:', e);
        return null;
    }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string, locale: string }> }): Promise<Metadata> {
    const { slug, locale } = await params;
    const session = await getServerSession(authOptions);
    const post = await getPost(slug, locale, !!session);

    if (!post) {
        // In metadata, we don't redirect, just show not found
        return { title: 'Post Not Found' };
    }

    return {
        title: post.title,
        description: post.excerpt,
        alternates: {
            canonical: `/${locale}/blog/${slug}`,
        },
        openGraph: {
            title: post.title,
            description: post.excerpt,
            type: 'article',
            publishedTime: post.published_at,
            authors: [post.author],
            images: post.cover_image ? [{ url: post.cover_image }] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.excerpt,
            images: post.cover_image ? [post.cover_image] : [],
        },
    };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string, locale: string }> }) {
    const { slug, locale } = await params;
    const session = await getServerSession(authOptions);
    const post = await getPost(slug, locale, !!session);

    if (!post) {
        // SMART REDIRECT: If post not found, maybe user switched language and the slug changed?
        const newSlug = await findTranslation(slug, locale, !!session);
        if (newSlug) {
            redirect(`/${locale}/blog/${newSlug}`);
        }
        notFound();
    }

    const articleJsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "image": post.cover_image ? [post.cover_image] : [],
        "datePublished": post.published_at || post.created_at,
        "author": [{
            "@type": "Person",
            "name": post.author,
            "url": process.env.NEXT_PUBLIC_SITE_URL || "https://checknode.io"
        }]
    };

    return (
        <>
            <JsonLd data={articleJsonLd} />
            <BlogPostClient post={post} />
        </>
    );
}
