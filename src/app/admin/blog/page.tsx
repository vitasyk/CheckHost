'use client';

import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Plus,
    Search,
    Edit3,
    Trash2,
    Eye,
    Loader2,
    CheckCircle2,
    Clock,
    FileText
} from 'lucide-react';
import { Header } from '@/components/Header';
import { useEffect, useState } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Post {
    id: string;
    title: string;
    slug: string;
    status: 'draft' | 'published';
    published_at: string | null;
    created_at: string;
}

export default function AdminBlogList() {
    const { data: session } = useSession();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchPosts = async () => {
        try {
            const res = await fetch('/api/admin/blog');
            if (res.ok) {
                const data = await res.json();
                setPosts(data);
            }
        } catch (error) {
            console.error('Failed to fetch posts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            const res = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setPosts(posts.filter(p => p.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete post:', error);
        }
    };

    const filteredPosts = posts.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
            <Header />

            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    <AdminSidebar />

                    {/* Main Content */}
                    <main className="flex-1 space-y-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Blog Management</h2>
                                <p className="text-slate-500 mt-1">Write and publish articles for your audience</p>
                            </div>
                            <Link href="/admin/blog/new">
                                <Button className="h-10 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-6 rounded-xl">
                                    <Plus className="h-4 w-4" />
                                    New Article
                                </Button>
                            </Link>
                        </div>

                        {/* Search and Filters */}
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <Input
                                placeholder="Search articles by title or slug..."
                                className="pl-11 h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 rounded-xl shadow-sm focus-visible:ring-indigo-500"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {/* Posts Table */}
                        <div className="grid gap-4">
                            {filteredPosts.length === 0 ? (
                                <Card className="p-12 text-center border-dashed border-2 border-slate-200 dark:border-white/10 bg-transparent flex flex-col items-center gap-4">
                                    <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                                        <FileText className="h-8 w-8 text-slate-300" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100">No articles found</h3>
                                        <p className="text-sm text-slate-500">Start sharing your knowledge by creating your first post.</p>
                                    </div>
                                    <Link href="/admin/blog/new">
                                        <Button variant="outline" className="mt-2">Create Post</Button>
                                    </Link>
                                </Card>
                            ) : (
                                filteredPosts.map((post) => (
                                    <Card key={post.id} className="p-4 sm:p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow group">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                        {post.title}
                                                    </h3>
                                                    <Badge
                                                        variant="secondary"
                                                        className={`text-[10px] uppercase font-bold tracking-tighter ${post.status === 'published'
                                                                ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                                            }`}
                                                    >
                                                        {post.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 font-medium">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="h-3 w-3" />
                                                        {post.status === 'published' ? `Published ${new Date(post.published_at!).toLocaleDateString()}` : `Created ${new Date(post.created_at).toLocaleDateString()}`}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 font-mono text-slate-400">
                                                        <Eye className="h-3 w-3" />
                                                        /{post.slug}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 sm:self-center">
                                                <Link href={`/blog/${post.slug}`} target="_blank">
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-500">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Link href={`/admin/blog/edit/${post.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-500">
                                                        <Edit3 className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/10 text-slate-400 hover:text-rose-500"
                                                    onClick={() => handleDelete(post.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
