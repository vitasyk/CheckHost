'use client';

import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import {
    Calendar,
    User,
    ChevronLeft,
    Loader2,
    Clock,
    Share2,
    Newspaper
} from 'lucide-react';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { AdSlot } from '@/components/AdSlot';

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
}

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await fetch(`/api/blog?slug=${slug}`);
                if (res.ok) {
                    const data = await res.json();
                    setPost(data);
                }
            } catch (error) {
                console.error('Failed to fetch blog post:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [slug]);

    const renderContent = (content: string) => {
        if (!content) return null;
        const parts = content.split('{{AD}}');
        return parts.map((part, index) => (
            <div key={index}>
                {part.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                ))}
                {index < parts.length - 1 && (
                    <AdSlot slotType="blog_content" className="my-12 px-4" />
                )}
            </div>
        ));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
                <Header />
                <div className="flex flex-col items-center justify-center p-48 text-slate-400 animate-pulse gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    <span>Loading your story...</span>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
                <Header />
                <div className="container mx-auto px-4 py-24 text-center">
                    <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
                    <p className="text-slate-500 mb-8">The article you're looking for was moved or deleted.</p>
                    <Link href="/blog">
                        <Button variant="outline">Back to Blog</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-500 pb-24">
            <Header />

            <article className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {/* Hero Section */}
                <header className="relative w-full h-[50vh] min-h-[400px] bg-slate-900 overflow-hidden">
                    {post.cover_image && (
                        <div className="absolute inset-0">
                            <img
                                src={post.cover_image}
                                alt={post.title}
                                className="w-full h-full object-cover opacity-50 blur-[2px]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                        </div>
                    )}

                    <div className="absolute inset-0 flex items-end">
                        <div className="container mx-auto px-4 pb-12 lg:pb-20">
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
                                        {new Date(post.published_at).toLocaleDateString('en-US', {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
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

                <div className="container mx-auto px-4 -mt-10 relative z-10">
                    <div className="max-w-4xl mx-auto">
                        {/* Post Content */}
                        <Card className="p-8 md:p-12 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-950 shadow-2xl rounded-3xl">
                            {post.ad_top && <AdSlot slotType="blog_top" className="mb-12" />}

                            <div className="prose prose-slate dark:prose-invert max-w-none 
                                prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900 dark:prose-headings:text-white
                                prose-p:text-lg prose-p:leading-loose prose-p:text-slate-600 dark:prose-p:text-slate-300
                                prose-strong:text-slate-900 dark:prose-strong:text-white
                                prose-img:rounded-3xl prose-img:shadow-lg
                                prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-a:font-bold prose-a:no-underline hover:prose-a:underline
                            ">
                                {renderContent(post.content)}
                            </div>

                            {post.ad_bottom && <AdSlot slotType="blog_bottom" className="mt-12" />}

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
            <section className="container mx-auto px-4 mt-24">
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
