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
    Clock,
    FileText,
    Zap,
    Tag,
    PlayCircle,
    CheckCircle2,
    XCircle,
    Sparkles,
    Upload,
    ChevronDown,
    Filter,
    ArrowUpDown,
    CheckSquare
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Link from 'next/link';

interface Post {
    id: string;
    title: string;
    slug: string;
    status: 'draft' | 'published';
    published_at: string | null;
    created_at: string;
}

interface Keyword {
    id: string;
    keyword: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    language: string;
    created_at: string;
}

type ActiveTab = 'posts' | 'keywords';

export default function AdminBlogList() {
    const { data: _session } = useSession();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<ActiveTab>('posts');

    // Keywords state
    const [keywords, setKeywords] = useState<Keyword[]>([]);
    const [keywordsLoading, setKeywordsLoading] = useState(false);
    // const [newKeyword, setNewKeyword] = useState(''); // reserved for single keyword input
    const [newKeywordLang, setNewKeywordLang] = useState('en');
    const [keywordsInput, setKeywordsInput] = useState('');
    const [addingKeyword, setAddingKeyword] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [genResult, setGenResult] = useState<any>(null);
    const [publishingId, setPublishingId] = useState<string | null>(null);

    // Filtering & Sorting
    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

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

    const fetchKeywords = async () => {
        setKeywordsLoading(true);
        try {
            const res = await fetch('/api/admin/blog-keywords');
            if (res.ok) {
                const data = await res.json();
                setKeywords(data);
            }
        } catch (error) {
            console.error('Failed to fetch keywords:', error);
        } finally {
            setKeywordsLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    useEffect(() => {
        if (activeTab === 'keywords') {
            fetchKeywords();
        }
    }, [activeTab]);

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

    const handlePublish = async (id: string) => {
        setPublishingId(id);
        try {
            const res = await fetch(`/api/admin/blog/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'published' }),
            });
            if (res.ok) {
                setPosts(posts.map(p => p.id === id ? { ...p, status: 'published', published_at: new Date().toISOString() } : p));
            }
        } catch (error) {
            console.error('Failed to publish post:', error);
        } finally {
            setPublishingId(null);
        }
    };

    const handleAddKeywords = async () => {
        const lines = keywordsInput.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) return;

        setAddingKeyword(true);
        try {
            await fetch('/api/admin/blog-keywords', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keywords: lines, language: newKeywordLang }),
            });
            setKeywordsInput('');
            await fetchKeywords();
        } catch (error) {
            console.error('Failed to add keywords:', error);
        } finally {
            setAddingKeyword(false);
        }
    };

    const handleDeleteKeyword = async (id: string) => {
        try {
            await fetch(`/api/admin/blog-keywords/${id}`, { method: 'DELETE' });
            setKeywords(keywords.filter(k => k.id !== id));
        } catch (error) {
            console.error('Failed to delete keyword:', error);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        setGenResult(null);
        try {
            const res = await fetch(`/api/cron/generate-blog-post?secret=${process.env.CRON_SECRET || ''}`);
            const data = await res.json();
            setGenResult(data);
            if (data.success) {
                await fetchPosts();
                await fetchKeywords();
                setActiveTab('posts');
            }
        } catch (error) {
            console.error('Generation failed:', error);
            setGenResult({ error: 'Request failed' });
        } finally {
            setGenerating(false);
        }
    };

    const filteredPosts = posts
        .filter(p => {
            const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
                p.slug.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            if (sortBy === 'title') return a.title.localeCompare(b.title);
            return 0;
        });

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(filteredPosts.map(p => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds([...selectedIds, id]);
        } else {
            setSelectedIds(selectedIds.filter(i => i !== id));
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} posts?`)) return;

        setIsBulkDeleting(true);
        try {
            const res = await fetch('/api/admin/blog', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds }),
            });
            if (res.ok) {
                setPosts(posts.filter(p => !selectedIds.includes(p.id)));
                setSelectedIds([]);
            }
        } catch (error) {
            console.error('Failed to bulk delete:', error);
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const statusIcon = (status: string) => {
        if (status === 'completed') return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
        if (status === 'failed') return <XCircle className="h-3.5 w-3.5 text-red-500" />;
        if (status === 'processing') return <Loader2 className="h-3.5 w-3.5 text-amber-500 animate-spin" />;
        return <Clock className="h-3.5 w-3.5 text-slate-400" />;
    };

    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
            <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                    <AdminSidebar />

                    {/* Main Content */}
                    <main className="flex-1 space-y-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Blog Management</h2>
                                <p className="text-slate-500 mt-1">Write, publish, and auto-generate articles for your audience</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={handleGenerate}
                                    disabled={generating}
                                    className="h-10 gap-2 bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 px-5 rounded-xl"
                                >
                                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                    {generating ? 'Generating...' : 'Generate Now'}
                                </Button>
                                <Link href="/admin/blog/import">
                                    <Button variant="outline" className="h-10 gap-2 px-5 rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-900/40 dark:text-indigo-400 dark:hover:bg-indigo-900/20">
                                        <Upload className="h-4 w-4" />
                                        Import
                                    </Button>
                                </Link>
                                <Link href="/admin/blog/new">
                                    <Button className="h-10 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-5 rounded-xl">
                                        <Plus className="h-4 w-4" />
                                        New Article
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Generate Result */}
                        {genResult && (
                            <Card className={`p-4 border ${genResult.success ? 'border-green-200 bg-green-50 dark:bg-green-900/10' : 'border-red-200 bg-red-50 dark:bg-red-900/10'}`}>
                                {genResult.success ? (
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold text-green-800 dark:text-green-300">Article Generated Successfully!</p>
                                            <p className="text-sm text-green-700 dark:text-green-400">Keyword: &quot;{genResult.keyword}&quot; · {genResult.languagesGenerated}/9 languages · {genResult.coverGenerated ? 'Cover image ✓' : 'No cover image'}</p>
                                            <p className="text-xs text-green-600 dark:text-green-500 mt-1">Saved as DRAFT — review in Posts tab and click Publish.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-3">
                                        <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold text-red-800 dark:text-red-300">Generation Failed</p>
                                            <p className="text-sm text-red-700 dark:text-red-400">{genResult.error || genResult.message}</p>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        )}

                        {/* Tabs */}
                        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 w-fit">
                            <button
                                onClick={() => setActiveTab('posts')}
                                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'posts' ? 'bg-white dark:bg-slate-800 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <FileText className="h-4 w-4" /> Posts ({posts.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('keywords')}
                                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'keywords' ? 'bg-white dark:bg-slate-800 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Tag className="h-4 w-4" /> AI Keywords ({keywords.length || '—'})
                            </button>
                        </div>

                        {/* POSTS TAB */}
                        {activeTab === 'posts' && (
                            <div className="space-y-4">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="relative group flex-1">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <Input
                                            placeholder="Search articles by title or slug..."
                                            className="pl-11 h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 rounded-xl shadow-sm focus-visible:ring-indigo-500"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-3">
                                            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                                                <SelectTrigger className="w-[160px] h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 rounded-xl shadow-sm focus:ring-indigo-500 gap-2 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <Filter className="h-4 w-4 text-slate-400" />
                                                        <SelectValue placeholder="Status" />
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-slate-200 dark:border-white/10 dark:bg-slate-900">
                                                    <SelectItem value="all">All Status</SelectItem>
                                                    <SelectItem value="published">Published</SelectItem>
                                                    <SelectItem value="draft">Drafts</SelectItem>
                                                </SelectContent>
                                            </Select>

                                            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                                                <SelectTrigger className="w-[180px] h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 rounded-xl shadow-sm focus:ring-indigo-500 gap-2 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <ArrowUpDown className="h-4 w-4 text-slate-400" />
                                                        <SelectValue placeholder="Sort by" />
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-slate-200 dark:border-white/10 dark:bg-slate-900">
                                                    <SelectItem value="newest">Newest First</SelectItem>
                                                    <SelectItem value="oldest">Oldest First</SelectItem>
                                                    <SelectItem value="title">Title A-Z</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {filteredPosts.length > 0 && (
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                checked={selectedIds.length === filteredPosts.length && filteredPosts.length > 0}
                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                            />
                                            <span>Select All</span>
                                            {selectedIds.length > 0 && (
                                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 font-bold">
                                                    {selectedIds.length} selected
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            Showing {filteredPosts.length} of {posts.length} articles
                                        </div>
                                    </div>
                                )}

                                <div className="grid gap-4">
                                    {filteredPosts.length === 0 ? (
                                        <Card className="p-12 text-center border-dashed border-2 border-slate-200 dark:border-white/10 bg-transparent flex flex-col items-center gap-4">
                                            <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                                                <FileText className="h-8 w-8 text-slate-300" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="font-bold text-slate-900 dark:text-slate-100">No articles found</h3>
                                                <p className="text-sm text-slate-500">Add keywords to the AI tab and click &quot;Generate Now&quot;.</p>
                                            </div>
                                        </Card>
                                    ) : (
                                        filteredPosts.map((post) => {
                                            const isSelected = selectedIds.includes(post.id);
                                            return (
                                                <Card
                                                    key={post.id}
                                                    className={`p-4 sm:p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all group relative overflow-hidden ${isSelected ? 'ring-2 ring-indigo-500/50 border-indigo-200 dark:border-indigo-900/40' : ''}`}
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className="pt-1.5">
                                                            <input
                                                                type="checkbox"
                                                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                                checked={isSelected}
                                                                onChange={(e) => handleSelectOne(post.id, e.target.checked)}
                                                            />
                                                        </div>
                                                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-3">
                                                                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                                        {post.title}
                                                                    </h3>
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className={`text-[10px] uppercase font-bold tracking-tighter ${post.status === 'published'
                                                                            ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                                                            : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
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
                                                                {post.status === 'draft' && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="h-9 px-3 rounded-lg border-green-200 text-green-600 hover:bg-green-50 gap-1.5 font-bold text-xs"
                                                                        onClick={() => handlePublish(post.id)}
                                                                        disabled={publishingId === post.id}
                                                                    >
                                                                        {publishingId === post.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
                                                                        Publish
                                                                    </Button>
                                                                )}
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
                                                    </div>
                                                </Card>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}

                        {/* KEYWORDS TAB */}
                        {activeTab === 'keywords' && (
                            <div className="space-y-6">
                                {/* Add Keywords Card */}
                                <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                                    <div className="space-y-1">
                                        <h3 className="font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                            <Zap className="h-4 w-4 text-violet-500" />
                                            Add SEO Keywords
                                        </h3>
                                        <p className="text-sm text-slate-500">One keyword per line. Each keyword will generate articles in all 9 languages.</p>
                                    </div>
                                    <textarea
                                        className="w-full min-h-[120px] p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-y"
                                        placeholder={"how to check ping online\nwhat is dns server\nhow to monitor uptime\nssl certificate check"}
                                        value={keywordsInput}
                                        onChange={(e) => setKeywordsInput(e.target.value)}
                                    />
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Primary Lang:</label>
                                            <select
                                                value={newKeywordLang}
                                                onChange={(e) => setNewKeywordLang(e.target.value)}
                                                className="h-9 px-2 rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-sm"
                                            >
                                                <option value="en">English</option>
                                                <option value="uk">Ukrainian</option>
                                                <option value="ru">Russian</option>
                                                <option value="es">Spanish</option>
                                                <option value="de">German</option>
                                            </select>
                                        </div>
                                        <Button
                                            onClick={handleAddKeywords}
                                            disabled={addingKeyword || !keywordsInput.trim()}
                                            className="h-9 px-5 bg-violet-600 hover:bg-violet-700 text-white gap-2 rounded-lg"
                                        >
                                            {addingKeyword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                            Add Keywords
                                        </Button>
                                    </div>
                                </Card>

                                {/* Keywords List */}
                                {keywordsLoading ? (
                                    <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
                                ) : (
                                    <div className="grid gap-2">
                                        {keywords.length === 0 ? (
                                            <Card className="p-8 text-center border-dashed border-2 border-slate-200 dark:border-white/10 bg-transparent">
                                                <Tag className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                                <p className="text-slate-500 text-sm">No keywords added yet. Add some above to start auto-generating articles!</p>
                                            </Card>
                                        ) : (
                                            keywords.map((kw) => (
                                                <Card key={kw.id} className="px-4 py-3 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-3">
                                                            {statusIcon(kw.status)}
                                                            <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">{kw.keyword}</span>
                                                            <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{kw.language}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded 
                                                                ${kw.status === 'completed' ? 'bg-green-100 text-green-600 dark:bg-green-900/20' :
                                                                    kw.status === 'failed' ? 'bg-red-100 text-red-600 dark:bg-red-900/20' :
                                                                        kw.status === 'processing' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/20' :
                                                                            'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                                                                {kw.status}
                                                            </span>
                                                            <button
                                                                onClick={() => handleDeleteKeyword(kw.id)}
                                                                className="text-slate-400 hover:text-rose-500 transition-colors"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <Card className="bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-6 py-4 flex items-center gap-6 shadow-2xl rounded-2xl border-none">
                        <div className="flex flex-col">
                            <span className="text-sm font-bold">{selectedIds.length} articles selected</span>
                            <span className="text-[10px] opacity-60 uppercase tracking-widest font-bold">Bulk Actions</span>
                        </div>
                        <div className="h-8 w-px bg-white/20 dark:bg-slate-900/20" />
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                className="text-white hover:bg-white/10 dark:text-slate-950 dark:hover:bg-slate-100 font-bold"
                                onClick={() => setSelectedIds([])}
                            >
                                Cancel
                            </Button>
                            <Button
                                disabled={isBulkDeleting}
                                className="bg-rose-500 hover:bg-rose-600 text-white border-none rounded-xl px-6 font-bold gap-2 shadow-lg shadow-rose-500/20"
                                onClick={handleBulkDelete}
                            >
                                {isBulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                Delete Selected
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
