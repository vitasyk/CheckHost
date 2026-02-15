'use client';

import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Calendar,
    User,
    ArrowRight,
    Loader2,
    BookOpen,
    Newspaper
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Post {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    cover_image: string;
    author: string;
    published_at: string;
}

export default function BlogListPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const res = await fetch('/api/blog');
                if (res.ok) {
                    const data = await res.json();
                    setPosts(data);
                }
            } catch (error) {
                console.error('Failed to fetch blog posts:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-500">
            <Header />

            <main className="container mx-auto px-4 py-16">
                <div className="max-w-4xl mx-auto text-center space-y-4 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-2">
                        <Newspaper className="h-6 w-6" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        CheckHost <span className="text-indigo-600">Blog</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">
                        Tips, guides, and updates on website monitoring, performance, and global infrastructure.
                    </p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-24 text-slate-400 animate-pulse gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        <span>Loading articles...</span>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center p-24 space-y-6">
                        <BookOpen className="h-16 w-16 text-slate-200 dark:text-slate-800 mx-auto" />
                        <h3 className="text-xl font-bold">New stories coming soon</h3>
                        <p className="text-slate-400">Our team is currently drafting some great content just for you.</p>
                        <Link href="/">
                            <Button variant="outline" className="mt-4">Back to Homepage</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                                <Card className="h-full overflow-hidden border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                                    <div className="aspect-[16/10] relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                                        {post.cover_image ? (
                                            <img
                                                src={post.cover_image}
                                                alt={post.title}
                                                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                                                <Newspaper className="h-12 w-12" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(post.published_at).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {post.author}
                                            </div>
                                        </div>
                                        <h2 className="text-xl font-bold mb-3 text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                                            {post.title}
                                        </h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-6 flex-1">
                                            {post.excerpt}
                                        </p>
                                        <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                                            <span>Read Article</span>
                                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
