import { Metadata } from 'next';
import { notFound } from 'next/navigation';
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
}

async function getPost(slug: string, isAdmin: boolean = false): Promise<Post | null> {
    try {
        if (isSupabaseConfigured) {
            let query = supabase
                .from('posts')
                .select('*')
                .eq('slug', slug);

            if (!isAdmin) {
                query = query.eq('status', 'published');
            }

            const { data } = await query.single();
            return data;
        }

        if (isPostgresConfigured) {
            const statusFilter = isAdmin ? '' : "AND status = 'published'";
            const result = await pool.query(
                `SELECT id, title, slug, excerpt, content, cover_image, author, published_at, ad_top, ad_bottom, status, created_at
                 FROM posts 
                 WHERE slug = $1 ${statusFilter} LIMIT 1`,
                [slug]
            );
            return result.rows[0] || null;
        }
    } catch (error) {
        console.error('Failed to fetch blog post for SEO:', error);
    }
    return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const session = await getServerSession(authOptions);
    const post = await getPost(slug, !!session);

    if (!post) return { title: 'Post Not Found' };

    return {
        title: post.title,
        description: post.excerpt,
        alternates: {
            canonical: `/blog/${slug}`,
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

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const session = await getServerSession(authOptions);
    const post = await getPost(slug, !!session);

    if (!post) {
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
