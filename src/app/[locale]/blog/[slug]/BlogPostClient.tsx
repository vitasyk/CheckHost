'use client';

import { Button } from '@/components/ui/button';
import {
    Calendar,
    User,
    ChevronLeft,
    Clock,
    Share2,
    Newspaper
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { query } from '@/lib/postgres';
import { Card } from '@/components/ui/card';
import { AdSlot } from '@/components/AdSlot';
import { marked } from 'marked';
import { useMemo } from 'react';

// Configure marked to handle line breaks professionally
marked.setOptions({
    breaks: true,
    gfm: true
});

interface Post {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    cover_image: string;
    author: string;
    published_at: string;
    created_at?: string;
    ad_top: boolean;
    ad_bottom: boolean;
    status: string;
}

export default function BlogPostClient({ post }: { post: Post }) {
    const isDraft = post.status === 'draft';

    // Pre-compute all HTML parts outside JSX so server and client produce
    // identical strings (avoids hydration mismatch from marked non-determinism)
    const contentParts = useMemo(() => {
        if (!post.content) return [];
        return post.content.split('{{AD}}').map((part) => {
            const trimmed = part.trim();
            if (!trimmed) return null;
            // If it's already HTML (starts with a tag), bypass marked
            const isHtml = /^<[a-z][\s\S]*>/i.test(trimmed);
            const html = isHtml ? trimmed : (marked.parse(trimmed) as string);
            // Замінюємо <h1> на <h2>, щоб уникнути декількох головних заголовків на сторінці
            return html.replace(/<h1/g, '<h2').replace(/<\/h1>/g, '</h2>');
        });
    }, [post.content]);

    const renderContent = () => {
        if (!contentParts.length) return null;

        return contentParts.map((html, index) => {
            if (html === null) return null;
            return (
                <div key={index}>
                    <div
                        className="article-content-wrapper"
                        dangerouslySetInnerHTML={{ __html: html }}
                        suppressHydrationWarning
                    />
                    {index < contentParts.length - 1 && (
                        <div className="my-16 flex justify-center">
                            <AdSlot slotType="blog_content" className="w-full max-w-2xl px-4" />
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-500 pb-24">
            {isDraft && (
                <div className="bg-amber-500 text-white text-center py-2 text-sm font-bold uppercase tracking-widest sticky top-0 z-[100] shadow-lg">
                    Draft Preview - Only visible to Admins
                </div>
            )}
            <article className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {/* Hero Section */}
                <header className="relative w-full h-[50vh] min-h-[400px] bg-slate-900 overflow-hidden">
                    {post.cover_image && (
                        <div className="absolute inset-0">
                            <img
                                src={post.cover_image}
                                alt={post.title || "Cover Image"}
                                width={1200}
                                height={600}
                                className="w-full h-full object-cover opacity-50 blur-[2px]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                        </div>
                    )}

                    <div className="absolute inset-0 flex items-end">
                        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 pb-12 lg:pb-20 w-full">
                            <div className="max-w-4xl mx-auto space-y-6">
                                <Link href="/blog">
                                    <Button variant="ghost" className="text-white hover:bg-white/10 -ml-4 gap-2 text-xs font-bold uppercase tracking-widest">
                                        <ChevronLeft className="h-4 w-4" />
                                        Back to Blog
                                    </Button>
                                </Link>
                                <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight">
                                    {post.title}
                                </h1>
                                <div className="flex flex-wrap items-center gap-8 text-slate-300 text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-indigo-400" />
                                        {post.author}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-indigo-400" />
                                        {post.published_at || post.created_at ? new Date((post.published_at || post.created_at) as string).toLocaleDateString('en-US', {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric'
                                        }) : 'Unknown Date'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-indigo-400" />
                                        {Math.ceil(post.content.split(' ').length / 200)} min read
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="max-w-[1440px] mx-auto px-4 sm:px-8 -mt-10 relative z-10 w-full">
                    <div className="max-w-4xl mx-auto">
                        {/* Post Content */}
                        <Card className="p-8 md:p-12 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-950 shadow-2xl rounded-3xl">
                            {(post.ad_top || process.env.NODE_ENV === 'development') && <AdSlot slotType="blog_top" className="mb-12" />}

                            <div className="prose prose-slate dark:prose-invert max-w-none 
                                prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900 dark:prose-headings:text-white
                                prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-8 prose-h2:border-l-4 prose-h2:border-indigo-500 prose-h2:pl-6
                                prose-h3:text-xl prose-h3:mt-12 prose-h3:mb-6
                                prose-p:text-lg prose-p:leading-loose prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:mb-8
                                prose-ul:my-8 prose-ul:space-y-4 prose-ol:my-8 prose-ol:space-y-4
                                prose-li:text-slate-600 dark:prose-li:text-slate-300
                                prose-strong:text-slate-900 dark:prose-strong:text-white prose-strong:font-black
                                prose-img:rounded-3xl prose-img:shadow-2xl prose-img:my-16
                                prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-2 prose-code:py-1 prose-code:rounded-lg prose-code:before:content-none prose-code:after:content-none
                                prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-a:font-bold prose-a:underline decoration-indigo-500/30 underline-offset-4 hover:decoration-indigo-500 transition-all
                            ">
                                {renderContent()}
                            </div>

                            {(post.ad_bottom || process.env.NODE_ENV === 'development') && <AdSlot slotType="blog_bottom" className="mt-12" />}

                            <hr className="my-12 border-slate-100 dark:border-white/5" />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                                        <Newspaper className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Authored by</p>
                                        <p className="font-bold text-slate-900 dark:text-slate-100">{post.author}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" className="h-12 w-12 rounded-2xl border border-slate-100 dark:border-white/5 gap-2 group">
                                    <Share2 className="h-5 w-5 text-slate-400 group-hover:text-indigo-500" />
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </article>

            {/* Newsletter / CTA */}
            <section className="max-w-[1440px] mx-auto px-4 sm:px-8 mt-24">
                <Card className="max-w-4xl mx-auto p-12 bg-indigo-600 dark:bg-indigo-900/40 border-0 rounded-[2.5rem] relative overflow-hidden text-center text-white">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Newspaper className="h-32 w-32" />
                    </div>
                    <div className="relative z-10 space-y-6">
                        <h2 className="text-3xl font-black">Stay updated on infrastructure tips</h2>
                        <p className="text-indigo-100 dark:text-indigo-300 max-w-md mx-auto font-medium">
                            Join our newsletter to receive the latest guides on website performance monitoring.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto pt-4">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 h-12 rounded-xl bg-white/10 border border-white/20 px-6 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                            />
                            <Button className="h-12 px-8 bg-white text-indigo-600 hover:bg-slate-100 font-bold rounded-xl shadow-xl shadow-indigo-900/20">
                                Subscribe
                            </Button>
                        </div>
                    </div>
                </Card>
            </section>
        </div>
    );
}
