'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Save,
    ChevronLeft,
    Loader2,
    Eye,
    Image as ImageIcon,
    Type,
    Link as LinkIcon,
    Layers,
    CheckCircle2,
    DollarSign,
    Zap,
    FileText
} from 'lucide-react';
import Link from 'next/link';

interface PostData {
    id?: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    cover_image: string;
    status: 'draft' | 'published';
    ad_top: boolean;
    ad_bottom: boolean;
}

interface BlogEditorProps {
    postId?: string;
}

export function BlogEditor({ postId }: BlogEditorProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(postId ? true : false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [post, setPost] = useState<PostData>({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        cover_image: '',
        status: 'draft',
        ad_top: false,
        ad_bottom: false
    });

    useEffect(() => {
        if (postId) {
            fetch(`/api/admin/blog/${postId}`)
                .then(res => res.json())
                .then(data => {
                    setPost(data);
                    setLoading(false);
                })
                .catch(err => console.error('Failed to fetch post:', err));
        }
    }, [postId]);

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
    };

    const handleTitleChange = (title: string) => {
        setPost(prev => ({
            ...prev,
            title,
            slug: prev.id ? prev.slug : generateSlug(title) // Auto-slug only for new posts
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const url = postId ? `/api/admin/blog/${postId}` : '/api/admin/blog';
            const method = postId ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(post),
            });

            if (res.ok) {
                setSaved(true);
                if (!postId) {
                    const data = await res.json();
                    router.push(`/admin/blog/edit/${data.id}`);
                } else {
                    setTimeout(() => setSaved(false), 3000);
                }
            }
        } catch (error) {
            console.error('Failed to save post:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-24">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/blog">
                        <Button variant="ghost" size="icon" className="rounded-xl border border-slate-200 dark:border-white/5">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            {postId ? 'Edit Article' : 'New Article'}
                        </h2>
                        <p className="text-sm text-slate-500">Draft your content and optimize for SEO</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="h-10 border-slate-200 dark:border-white/5 px-6 rounded-xl gap-2"
                        onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                        disabled={!post.slug}
                    >
                        <Eye className="h-4 w-4" />
                        Preview
                    </Button>
                    <Button
                        className="h-10 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-6 rounded-xl"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                        {saved ? 'Saved' : postId ? 'Update Post' : 'Create Post'}
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6 sm:p-8 space-y-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm">
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Type className="h-3 w-3" /> Article Title
                            </label>
                            <Input
                                value={post.title}
                                onChange={(e) => handleTitleChange(e.target.value)}
                                placeholder="Enter a catchy title..."
                                className="h-14 text-xl font-bold bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 rounded-xl focus-visible:ring-indigo-500"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <FileText className="h-3 w-3" /> Content (Markdown supported)
                            </label>
                            <textarea
                                value={post.content}
                                onChange={(e) => setPost({ ...post, content: e.target.value })}
                                placeholder="Write your story here..."
                                className="w-full min-h-[400px] p-6 bg-slate-50 dark:bg-white/5 border-[1px] border-slate-200 dark:border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-serif text-lg leading-relaxed text-slate-800 dark:text-slate-200"
                            />
                        </div>
                    </Card>

                    <Card className="p-6 sm:p-8 space-y-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm">
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <FileText className="h-3 w-3" /> Excerpt (Short Summary)
                            </label>
                            <textarea
                                value={post.excerpt}
                                onChange={(e) => setPost({ ...post, excerpt: e.target.value })}
                                placeholder="A brief summary for search engines and list pages..."
                                className="w-full min-h-[100px] p-4 bg-slate-50 dark:bg-white/5 border-[1px] border-slate-200 dark:border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-600 dark:text-slate-400"
                            />
                        </div>
                    </Card>
                </div>

                {/* Sidebar Settings Area */}
                <div className="space-y-6">
                    <Card className="p-6 space-y-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm">
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Layers className="h-3 w-3" /> Publishing Status
                            </label>
                            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                {['draft', 'published'].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setPost({ ...post, status: s as any })}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all ${post.status === s
                                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <LinkIcon className="h-3 w-3" /> URL Slug
                            </label>
                            <Input
                                value={post.slug}
                                onChange={(e) => setPost({ ...post, slug: e.target.value })}
                                placeholder="url-friendly-slug"
                                className="h-10 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 rounded-lg font-mono text-xs"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <ImageIcon className="h-3 w-3" /> Cover Image URL
                            </label>
                            <Input
                                value={post.cover_image}
                                onChange={(e) => setPost({ ...post, cover_image: e.target.value })}
                                placeholder="https://example.com/image.jpg"
                                className="h-10 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 rounded-lg text-xs"
                            />
                            {post.cover_image && (
                                <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 aspect-video relative group">
                                    <img src={post.cover_image} alt="Preview" className="object-cover w-full h-full" />
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card className="p-6 space-y-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm">
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <DollarSign className="h-3 w-3" /> Monetization
                            </label>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Ad at Top</p>
                                        <p className="text-[10px] text-slate-500">Render before content</p>
                                    </div>
                                    <button
                                        onClick={() => setPost({ ...post, ad_top: !post.ad_top })}
                                        className={`w-10 h-6 rounded-full transition-colors relative ${post.ad_top ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${post.ad_top ? 'left-5' : 'left-1'}`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Ad at Bottom</p>
                                        <p className="text-[10px] text-slate-500">Render after content</p>
                                    </div>
                                    <button
                                        onClick={() => setPost({ ...post, ad_bottom: !post.ad_bottom })}
                                        className={`w-10 h-6 rounded-full transition-colors relative ${post.ad_bottom ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${post.ad_bottom ? 'left-5' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                            <div className="flex gap-2 items-start">
                                <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-tight">Flexible Placement</p>
                                    <p className="text-[10px] text-amber-600 dark:text-amber-500 leading-tight">
                                        Insert <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">{"{{AD}}"}</code> anywhere in the text to inject in-content ads.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/30 dark:bg-indigo-900/10">
                        <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-2">Editor Pro-tip</h4>
                        <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed">
                            Use Markdown for better formatting. You can add images, lists, and code blocks using standard syntax.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
}
