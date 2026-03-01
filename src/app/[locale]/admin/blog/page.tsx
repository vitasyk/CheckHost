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
    EyeOff,
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
    Filter,
    ArrowUpDown,
    Settings2,
    ImageIcon,
    Globe2,
    X,
    ChevronDown,
    RefreshCw,
    Timer,
    CalendarClock,
    Send,
    LayoutDashboard,
    Save,
    ToggleLeft,
    ToggleRight,
    Replace,
    AlertTriangle,
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Suspense } from 'react';

interface Post {
    id: string;
    title: string;
    slug: string;
    status: 'draft' | 'published';
    published_at: string | null;
    created_at: string;
    locale: string;
}

interface Keyword {
    id: string;
    keyword: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    language: string;
    created_at: string;
}

interface KeywordConfig {
    languages: string[];
    providerOverride: string;
    generateCover: boolean;
}

type ActiveTab = 'posts' | 'keywords' | 'seo' | 'replacer';

// ── Countdown formatter ───────────────────────────────────────────────────
function formatCountdown(isoTimestamp: string, _tick: number): string {
    const diff = new Date(isoTimestamp).getTime() - Date.now();
    if (diff <= 0) return 'Overdue';
    const totalMinutes = Math.floor(diff / 60_000);
    if (totalMinutes < 60) return `${totalMinutes}m`;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours < 24) return `${hours}h ${minutes}m`;
    const days = Math.floor(hours / 24);
    const remH = hours % 24;
    return `${days}d ${remH}h`;
}


const ALL_LOCALES = [
    { code: 'en', flag: '🇬🇧', name: 'English' },
    { code: 'uk', flag: '🇺🇦', name: 'Ukrainian' },
    { code: 'es', flag: '🇪🇸', name: 'Spanish' },
    { code: 'de', flag: '🇩🇪', name: 'German' },
    { code: 'fr', flag: '🇫🇷', name: 'French' },
    { code: 'ru', flag: '🇷🇺', name: 'Russian' },
    { code: 'nl', flag: '🇳🇱', name: 'Dutch' },
    { code: 'pl', flag: '🇵🇱', name: 'Polish' },
    { code: 'it', flag: '🇮🇹', name: 'Italian' },
];

export default function AdminBlogList() {
    return (
        <Suspense fallback={
            <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        }>
            <AdminBlogListContent />
        </Suspense>
    );
}

function AdminBlogListContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { data: _session } = useSession();
    const t = useTranslations('Admin.blog');
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    // Posts filtering state initialized from URL
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    const [activeTab, setActiveTab] = useState<ActiveTab>((searchParams.get('tab') as ActiveTab) || 'posts');
    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>((searchParams.get('status') as any) || 'all');
    const [localeFilter, setLocaleFilter] = useState<string>(searchParams.get('locale') || 'all');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>((searchParams.get('sort') as any) || 'newest');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Sync state to URL
    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (activeTab !== 'posts') params.set('tab', activeTab);
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (localeFilter !== 'all') params.set('locale', localeFilter);
        if (sortBy !== 'newest') params.set('sort', sortBy);

        const query = params.toString();
        router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
    }, [debouncedSearch, activeTab, statusFilter, localeFilter, sortBy, router, pathname]);

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setLocaleFilter('all');
        setSortBy('newest');
    };

    const hasFilters = search !== '' || statusFilter !== 'all' || localeFilter !== 'all' || sortBy !== 'newest';
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    // Keywords state
    const [keywords, setKeywords] = useState<Keyword[]>([]);
    const [keywordsLoading, setKeywordsLoading] = useState(false);
    const [keywordsInput, setKeywordsInput] = useState('');
    const [addingKeyword, setAddingKeyword] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [genResult, setGenResult] = useState<any>(null);
    const [publishingId, setPublishingId] = useState<string | null>(null);

    // ── Blog Cron Config ──────────────────────────────────────────
    const [cronConfig, setCronConfig] = useState<any>({
        generateEnabled: false, generateIntervalHours: 6,
        generateLastRun: null, generateNextRun: null,
        publishEnabled: false, publishIntervalHours: 12,
        publishMaxPerRun: 1, publishLastRun: null, publishNextRun: null,
    });
    const [_cronLoading, setCronLoading] = useState(false);
    const [cronSaving, setCronSaving] = useState(false);
    const [triggeringGen, setTriggeringGen] = useState(false);
    const [triggeringPub, setTriggeringPub] = useState(false);
    const [tick, setTick] = useState(0); // for countdown re-render

    // ── SEO Content Block ──────────────────────────────────────────
    const [seoHtml, setSeoHtml] = useState('');
    const [seoEnabled, setSeoEnabled] = useState(true);
    const [seoShowDefault, setSeoShowDefault] = useState(false);
    const [savingSeo, setSavingSeo] = useState(false);
    const [seoSaved, setSeoSaved] = useState(false);
    const [seoPreview, setSeoPreview] = useState(false);
    const [seoLoading, setSeoLoading] = useState(false);

    // ── Link/Text Replacer ──────────────────────────────────────────
    const [findText, setFindText] = useState('');
    const [replaceWith, setReplaceWith] = useState('');
    const [replacing, setReplacing] = useState(false);
    const [replacerResult, setReplacerResult] = useState<any>(null);

    // Global defaults for new keywords
    const [globalLangs, setGlobalLangs] = useState<string[]>(ALL_LOCALES.map(l => l.code));
    const [globalProvider, setGlobalProvider] = useState('auto');
    const [globalCover, setGlobalCover] = useState(false);

    // Per-keyword config (client-side, id -> config)
    const [keywordConfigs, setKeywordConfigs] = useState<Record<string, KeywordConfig>>({});
    const [expandedConfig, setExpandedConfig] = useState<string | null>(null);
    const [selectedKwIds, setSelectedKwIds] = useState<string[]>([]);

    // Posts filtering



    const fetchPosts = async () => {
        try {
            const res = await fetch('/api/admin/blog');
            if (res.ok) setPosts(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchKeywords = async () => {
        setKeywordsLoading(true);
        try {
            const res = await fetch('/api/admin/blog-keywords');
            if (res.ok) setKeywords(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setKeywordsLoading(false);
        }
    };

    const fetchCronConfig = useCallback(async () => {
        setCronLoading(true);
        try {
            const res = await fetch('/api/admin/blog-cron');
            if (res.ok) setCronConfig(await res.json());
        } catch { /* ignore */ } finally { setCronLoading(false); }
    }, []);

    const fetchSeoContent = useCallback(async () => {
        setSeoLoading(true);
        try {
            const res = await fetch('/api/admin/settings?key=homepage_seo_content');
            if (res.ok) {
                const data = await res.json();
                if (data) {
                    setSeoHtml(data.html || '');
                    setSeoEnabled(data.enabled !== false);
                    setSeoShowDefault(data.showDefault === true);
                }
            }
        } catch { /* ignore */ } finally { setSeoLoading(false); }
    }, []);

    const handleSaveSeoContent = async () => {
        setSavingSeo(true);
        try {
            await fetch('/api/admin/settings?key=homepage_seo_content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    html: seoHtml,
                    enabled: seoEnabled,
                    showDefault: seoShowDefault
                }),
            });
            setSeoSaved(true);
            setTimeout(() => setSeoSaved(false), 3000);
        } catch { /* ignore */ } finally { setSavingSeo(false); }
    };

    const saveCronConfig = async (patch: any) => {
        const updated = { ...cronConfig, ...patch };
        setCronConfig(updated);
        setCronSaving(true);
        try { await fetch('/api/admin/blog-cron', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) }); }
        finally { setCronSaving(false); }
    };

    const triggerGenerate = async () => {
        setTriggeringGen(true);
        try { await handleGenerate(); await fetchCronConfig(); }
        finally { setTriggeringGen(false); }
    };

    const triggerPublish = async () => {
        setTriggeringPub(true);
        try {
            await fetch(`/api/cron/publish-blog-posts?secret=&max=${cronConfig.publishMaxPerRun || 1}`);
            await fetchCronConfig();
            await fetchPosts();
        } finally { setTriggeringPub(false); }
    };

    // Countdown update every 60s
    useEffect(() => {
        const id = setInterval(() => setTick(t => t + 1), 60_000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => { fetchPosts(); }, []);
    useEffect(() => {
        if (activeTab === 'keywords') {
            fetchKeywords();
            fetchCronConfig();
        }
        if (activeTab === 'seo') {
            fetchSeoContent();
        }
    }, [activeTab, fetchCronConfig, fetchSeoContent]);

    const getConfig = (id: string): KeywordConfig =>
        keywordConfigs[id] || { languages: [...globalLangs], providerOverride: globalProvider, generateCover: globalCover };

    const setConfig = (id: string, patch: Partial<KeywordConfig>) =>
        setKeywordConfigs(prev => ({ ...prev, [id]: { ...getConfig(id), ...patch } }));

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this post?')) return;
        const res = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
        if (res.ok) setPosts(p => p.filter(x => x.id !== id));
    };

    const handlePublish = async (id: string) => {
        setPublishingId(id);
        try {
            const res = await fetch(`/api/admin/blog/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'published' }),
            });
            if (res.ok) setPosts(p => p.map(x => x.id === id ? { ...x, status: 'published', published_at: new Date().toISOString() } : x));
        } finally { setPublishingId(null); }
    };

    const handleAddKeywords = async () => {
        const lines = keywordsInput.split('\n').map(l => l.trim()).filter(Boolean);
        if (!lines.length || !globalLangs.length) return;
        setAddingKeyword(true);
        try {
            await fetch('/api/admin/blog-keywords', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keywords: lines, language: globalLangs[0] }),
            });
            setKeywordsInput('');
            await fetchKeywords();
        } finally { setAddingKeyword(false); }
    };

    const handleDeleteKeyword = async (id: string) => {
        await fetch(`/api/admin/blog-keywords/${id}`, { method: 'DELETE' });
        setKeywords(k => k.filter(x => x.id !== id));
        setSelectedKwIds(p => p.filter(i => i !== id));
    };

    const handleBulkDeleteKeywords = async () => {
        if (!confirm(`Delete ${selectedKwIds.length} keywords?`)) return;
        await Promise.all(selectedKwIds.map(id => fetch(`/api/admin/blog-keywords/${id}`, { method: 'DELETE' })));
        setKeywords(k => k.filter(x => !selectedKwIds.includes(x.id)));
        setSelectedKwIds([]);
    };

    const handleGenerate = async () => {
        setGenerating(true);
        setGenResult(null);
        try {
            const res = await fetch(`/api/cron/generate-blog-post?secret=${process.env.CRON_SECRET || ''}`);
            const data = await res.json();
            setGenResult(data);
            if (data.success) { await fetchPosts(); await fetchKeywords(); setActiveTab('posts'); }
        } catch { setGenResult({ error: 'Request failed' }); }
        finally { setGenerating(false); }
    };

    const handleReplaceText = async (dryRun: boolean = false) => {
        if (!findText) return;
        if (!dryRun && !confirm(`Are you sure you want to replace "${findText}" with "${replaceWith}" in all articles? This cannot be undone.`)) return;

        setReplacing(true);
        setReplacerResult(null);
        try {
            const res = await fetch('/api/admin/blog/replace-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ findText, replaceWith, dryRun }),
            });
            const data = await res.json();
            setReplacerResult(data);
            if (!dryRun && data.success) {
                fetchPosts();
            }
        } catch {
            setReplacerResult({ error: 'Request failed' });
        } finally {
            setReplacing(false);
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedIds.length} posts?`)) return;
        setIsBulkDeleting(true);
        try {
            const res = await fetch('/api/admin/blog', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds }),
            });
            if (res.ok) { setPosts(p => p.filter(x => !selectedIds.includes(x.id))); setSelectedIds([]); }
        } finally { setIsBulkDeleting(false); }
    };

    const filteredPosts = posts
        .filter(p => {
            const q = search.toLowerCase();
            const matchSearch = p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
            const matchStatus = statusFilter === 'all' || p.status === statusFilter;
            const matchLocale = localeFilter === 'all' || p.locale === localeFilter;
            return matchSearch && matchStatus && matchLocale;
        })
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            return a.title.localeCompare(b.title);
        });

    const statusIcon = (s: string) => ({
        completed: <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />,
        failed: <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />,
        processing: <Loader2 className="h-3.5 w-3.5 text-amber-500 animate-spin shrink-0" />,
    } as any)[s] || <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />;

    const statusBadge = (s: string) => {
        const cls: Record<string, string> = {
            completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            failed: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
            processing: 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 animate-pulse',
            pending: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
        };
        return <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${cls[s] || cls.pending}`}>{s}</span>;
    };

    if (loading) return (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
    );

    const pendingKeywords = keywords.filter(k => k.status === 'pending');
    const allKwSelected = selectedKwIds.length === keywords.length && keywords.length > 0;
    const kwCount = keywordsInput.split('\n').filter(l => l.trim()).length;

    const LanguagePicker = ({
        selected, onChange
    }: {
        selected: string[];
        onChange: (langs: string[]) => void;
    }) => (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Globe2 className="h-3.5 w-3.5 text-indigo-400" /> Target Languages
                </label>
                <div className="flex gap-2">
                    <button onClick={() => onChange(ALL_LOCALES.map(l => l.code))} className="text-[10px] text-indigo-500 hover:underline font-medium">All</button>
                    <span className="text-slate-300">·</span>
                    <button onClick={() => onChange(['en'])} className="text-[10px] text-indigo-500 hover:underline font-medium">EN only</button>
                    <span className="text-slate-300">·</span>
                    <button onClick={() => onChange([])} className="text-[10px] text-slate-400 hover:underline font-medium">None</button>
                </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {ALL_LOCALES.map(l => {
                    const active = selected.includes(l.code);
                    return (
                        <button
                            key={l.code}
                            onClick={() => onChange(active ? selected.filter(c => c !== l.code) : [...selected, l.code])}
                            title={l.name}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs border font-semibold transition-all ${active
                                ? 'bg-indigo-100 border-indigo-300 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-500/40 dark:text-indigo-300'
                                : 'bg-white border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-white/5 opacity-40'}`}
                        >
                            {l.flag} <span className="uppercase text-[10px]">{l.code}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
            <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                    <AdminSidebar />

                    <main className="flex-1 space-y-8">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Blog Management</h2>
                                <p className="text-slate-500 mt-1">Write, publish, and auto-generate articles for your audience</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button onClick={handleGenerate} disabled={generating}
                                    className="h-10 gap-2 bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 px-5 rounded-xl">
                                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                    {generating ? 'Generating...' : 'Generate Now'}
                                </Button>
                                <Link href="/admin/blog/import">
                                    <Button variant="outline" className="h-10 gap-2 px-5 rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-900/40 dark:text-indigo-400 dark:hover:bg-indigo-900/20">
                                        <Upload className="h-4 w-4" /> Import
                                    </Button>
                                </Link>
                                <Link href="/admin/blog/new">
                                    <Button className="h-10 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-5 rounded-xl">
                                        <Plus className="h-4 w-4" /> New Article
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Gen Result banner */}
                        {genResult && (
                            <Card className={`p-4 border ${genResult.success ? 'border-green-200 bg-green-50 dark:bg-green-900/10' : 'border-red-200 bg-red-50 dark:bg-red-900/10'}`}>
                                <div className="flex items-start gap-3">
                                    {genResult.success
                                        ? <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                                        : <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />}
                                    <div className="flex-1">
                                        {genResult.success ? (
                                            <>
                                                <p className="font-bold text-green-800 dark:text-green-300">Article Generated Successfully!</p>
                                                <p className="text-sm text-green-700 dark:text-green-400">
                                                    Keyword: &quot;{genResult.keyword}&quot; · {genResult.languagesGenerated}/9 languages · {genResult.coverGenerated ? 'Cover ✓' : 'No cover'}
                                                </p>
                                                {genResult.results && (
                                                    <div className="flex gap-0.5 mt-1.5 flex-wrap">
                                                        {ALL_LOCALES.map(l => (
                                                            <span key={l.code} title={`${l.name}: ${genResult.results[l.code] || 'skipped'}`}
                                                                className={`text-base ${genResult.results[l.code] === 'ok' ? 'opacity-100' : 'opacity-20'}`}>
                                                                {l.flag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                <p className="text-xs text-green-600 mt-1">Saved as DRAFT — review in Posts tab and click Publish.</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="font-bold text-red-800 dark:text-red-300">Generation Failed</p>
                                                <p className="text-sm text-red-700">{genResult.error || genResult.message}</p>
                                            </>
                                        )}
                                    </div>
                                    <button onClick={() => setGenResult(null)} className="shrink-0 text-slate-400 hover:text-slate-600">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </Card>
                        )}

                        {/* Tabs */}
                        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 w-fit flex-wrap">
                            <button onClick={() => setActiveTab('posts')}
                                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'posts' ? 'bg-white dark:bg-slate-800 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}>
                                <FileText className="h-4 w-4" /> Posts ({posts.length})
                            </button>
                            <button onClick={() => setActiveTab('keywords')}
                                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'keywords' ? 'bg-white dark:bg-slate-800 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}>
                                <Tag className="h-4 w-4" /> AI Queue ({keywords.length || '—'})
                            </button>
                            <button onClick={() => setActiveTab('seo')}
                                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'seo' ? 'bg-white dark:bg-slate-800 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}>
                                <LayoutDashboard className="h-4 w-4" /> SEO Block
                            </button>
                            <button onClick={() => setActiveTab('replacer')}
                                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'replacer' ? 'bg-white dark:bg-slate-800 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}>
                                <Replace className="h-4 w-4" /> Replacer
                            </button>
                        </div>

                        {/* ── POSTS TAB ── */}
                        {activeTab === 'posts' && (
                            <div className="space-y-4">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="relative group flex-1">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <Input placeholder="Search articles..." className="pl-11 h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 rounded-xl shadow-sm" value={search} onChange={e => setSearch(e.target.value)} />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Select value={localeFilter} onValueChange={setLocaleFilter}>
                                            <SelectTrigger className="w-[140px] h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 rounded-xl shadow-sm gap-2 px-4 text-xs">
                                                <div className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-slate-400" /><SelectValue placeholder="All Languages" /></div>
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="all">All Languages</SelectItem>
                                                {ALL_LOCALES.map(l => (
                                                    <SelectItem key={l.code} value={l.code}>{l.flag} {l.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
                                            <SelectTrigger className="w-[140px] h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 rounded-xl shadow-sm gap-2 px-4 text-xs">
                                                <div className="flex items-center gap-2"><Filter className="h-4 w-4 text-slate-400" /><SelectValue /></div>
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl"><SelectItem value="all">All Status</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="draft">Drafts</SelectItem></SelectContent>
                                        </Select>
                                        <Select value={sortBy} onValueChange={v => setSortBy(v as any)}>
                                            <SelectTrigger className="w-[160px] h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 rounded-xl shadow-sm gap-2 px-4 text-xs">
                                                <div className="flex items-center gap-2"><ArrowUpDown className="h-4 w-4 text-slate-400" /><SelectValue /></div>
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl"><SelectItem value="newest">Newest First</SelectItem><SelectItem value="oldest">Oldest First</SelectItem><SelectItem value="title">Title A-Z</SelectItem></SelectContent>
                                        </Select>

                                        {hasFilters && (
                                            <Button
                                                variant="ghost"
                                                onClick={clearFilters}
                                                className="h-12 px-4 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 gap-2 text-xs font-bold"
                                            >
                                                <X className="h-4 w-4" />
                                                Clear
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {filteredPosts.length > 0 && (
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                checked={selectedIds.length === filteredPosts.length}
                                                onChange={e => setSelectedIds(e.target.checked ? filteredPosts.map(p => p.id) : [])} />
                                            <span>Select All</span>
                                            {selectedIds.length > 0 && <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 font-bold">{selectedIds.length} selected</Badge>}
                                        </div>
                                        <div className="text-xs text-slate-400">Showing {filteredPosts.length} of {posts.length}</div>
                                    </div>
                                )}

                                <div className="grid gap-4">
                                    {filteredPosts.length === 0 ? (
                                        <Card className="p-12 text-center border-dashed border-2 border-slate-200 dark:border-white/10 bg-transparent flex flex-col items-center gap-4">
                                            <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                                                <FileText className="h-8 w-8 text-slate-300" />
                                            </div>
                                            <div><h3 className="font-bold text-slate-900 dark:text-slate-100">No articles found</h3><p className="text-sm text-slate-500">Add keywords to the AI tab and click &quot;Generate Now&quot;.</p></div>
                                        </Card>
                                    ) : filteredPosts.map(post => (
                                        <Card key={post.id} className={`p-4 sm:p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all group ${selectedIds.includes(post.id) ? 'ring-2 ring-indigo-500/50' : ''}`}>
                                            <div className="flex items-start gap-4">
                                                <div className="pt-1.5">
                                                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 cursor-pointer"
                                                        checked={selectedIds.includes(post.id)}
                                                        onChange={e => setSelectedIds(prev => e.target.checked ? [...prev, post.id] : prev.filter(i => i !== post.id))} />
                                                </div>
                                                <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xl shrink-0" title={post.locale}>
                                                                {ALL_LOCALES.find(l => l.code === post.locale)?.flag || '🌐'}
                                                            </span>
                                                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">{post.title}</h3>
                                                            <Badge variant="secondary" className={`text-[10px] uppercase font-bold ${post.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                {post.status}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
                                                            <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" />
                                                                {post.status === 'published' ? `Published ${new Date(post.published_at!).toLocaleDateString()}` : `Created ${new Date(post.created_at).toLocaleDateString()}`}
                                                            </span>
                                                            <span className="flex items-center gap-1.5 font-mono text-slate-400"><Eye className="h-3 w-3" />/{post.slug}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 sm:self-center">
                                                        {post.status === 'draft' && (
                                                            <Button variant="outline" size="sm" className="h-9 px-3 rounded-lg border-green-200 text-green-600 hover:bg-green-50 gap-1.5 font-bold text-xs"
                                                                onClick={() => handlePublish(post.id)} disabled={publishingId === post.id}>
                                                                {publishingId === post.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />} Publish
                                                            </Button>
                                                        )}
                                                        <Link href={`/blog/${post.slug}`} target="_blank">
                                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-slate-400 hover:text-indigo-500"><Eye className="h-4 w-4" /></Button>
                                                        </Link>
                                                        <Link href={`/admin/blog/edit/${post.id}`}>
                                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-slate-400 hover:text-emerald-500"><Edit3 className="h-4 w-4" /></Button>
                                                        </Link>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10"
                                                            onClick={() => handleDelete(post.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ═══════════════════════════════════════════
                            AI QUEUE TAB — REDESIGNED
                            ═══════════════════════════════════════════ */}
                        {activeTab === 'keywords' && (
                            <div className="space-y-5">

                                {/* Add to Queue Panel */}
                                <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm space-y-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-0.5">
                                            <h3 className="font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                                <Zap className="h-4 w-4 text-violet-500" /> Add to Generation Queue
                                            </h3>
                                            <p className="text-xs text-slate-500">One keyword per line. Configure target languages and provider below.</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-xs text-slate-400 font-medium">{pendingKeywords.length} pending</span>
                                            <Button onClick={handleGenerate} disabled={generating || pendingKeywords.length === 0} size="sm"
                                                className="h-8 px-4 bg-violet-600 hover:bg-violet-700 text-white gap-1.5 rounded-lg text-xs font-bold">
                                                {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                                                {generating ? 'Generating...' : 'Run Queue'}
                                            </Button>
                                        </div>
                                    </div>

                                    <textarea
                                        className="w-full min-h-[96px] p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-y"
                                        placeholder={"how to check ping online\nwhat is dns server\nhow to monitor uptime"}
                                        value={keywordsInput}
                                        onChange={e => setKeywordsInput(e.target.value)}
                                    />

                                    {/* Global defaults */}
                                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-white/5 space-y-4">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Default settings for all keywords above</p>

                                        <LanguagePicker selected={globalLangs} onChange={setGlobalLangs} />

                                        <div className="flex flex-wrap gap-5 items-center pt-1 border-t border-slate-100 dark:border-white/5">
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">AI Provider:</label>
                                                <select value={globalProvider} onChange={e => setGlobalProvider(e.target.value)}
                                                    className="h-7 px-2 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs">
                                                    <option value="auto">Auto (fallback chain)</option>
                                                    <option value="gemini">Gemini</option>
                                                    <option value="groq">Groq (Free)</option>
                                                    <option value="openai">OpenAI</option>
                                                    <option value="claude">Claude</option>
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                                    <ImageIcon className="h-3.5 w-3.5 text-pink-400" /> Cover Image (DALL-E):
                                                </label>
                                                <Switch checked={globalCover} onCheckedChange={setGlobalCover} className="scale-75" />
                                                <span className={`text-[10px] font-bold ${globalCover ? 'text-pink-500' : 'text-slate-400'}`}>
                                                    {globalCover ? 'ON (~$0.04)' : 'OFF'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Button onClick={handleAddKeywords} disabled={addingKeyword || !keywordsInput.trim() || globalLangs.length === 0}
                                            className="h-9 px-5 bg-violet-600 hover:bg-violet-700 text-white gap-2 rounded-lg text-sm font-bold">
                                            {addingKeyword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                            Add to Queue
                                        </Button>
                                        {globalLangs.length === 0 && <p className="text-xs text-amber-500 font-medium">⚠ Select at least one language</p>}
                                        <span className="text-xs text-slate-400 ml-auto">{kwCount} keyword(s) · {globalLangs.length} lang(s)</span>
                                    </div>
                                </Card>

                                {/* Queue Table */}
                                {keywordsLoading ? (
                                    <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
                                ) : keywords.length === 0 ? (
                                    <Card className="p-10 text-center border-dashed border-2 border-slate-200 dark:border-white/10 bg-transparent flex flex-col items-center gap-3">
                                        <Tag className="h-10 w-10 text-slate-200 dark:text-slate-700" />
                                        <p className="font-semibold text-slate-500">Queue is empty</p>
                                        <p className="text-sm text-slate-400">Add keywords above to start auto-generating multilingual articles.</p>
                                    </Card>
                                ) : (
                                    <Card className="border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                                        {/* Table header */}
                                        <div className="flex items-center px-4 py-2.5 border-b border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-slate-950/40 gap-3">
                                            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 cursor-pointer"
                                                checked={allKwSelected} onChange={e => setSelectedKwIds(e.target.checked ? keywords.map(k => k.id) : [])} />
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex-1">Keyword</span>
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest w-44 hidden md:block">Languages</span>
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest w-24 text-right">Status</span>
                                            <div className="ml-4 w-20 flex justify-end">
                                                {selectedKwIds.length > 0 ? (
                                                    <Button onClick={handleBulkDeleteKeywords} size="sm" variant="outline"
                                                        className="h-7 px-2 text-xs border-red-200 text-red-500 hover:bg-red-50 gap-1">
                                                        <Trash2 className="h-3 w-3" /> {selectedKwIds.length}
                                                    </Button>
                                                ) : (
                                                    <button onClick={fetchKeywords} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                                                        <RefreshCw className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Rows */}
                                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                                            {keywords.map(kw => {
                                                const cfg = getConfig(kw.id);
                                                const isExpanded = expandedConfig === kw.id;
                                                const isSelected = selectedKwIds.includes(kw.id);
                                                return (
                                                    <div key={kw.id} className={`transition-colors ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-900/5' : 'hover:bg-slate-50/60 dark:hover:bg-slate-950/30'}`}>
                                                        {/* Main row */}
                                                        <div className="flex items-center px-4 py-3 gap-3">
                                                            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 cursor-pointer shrink-0"
                                                                checked={isSelected}
                                                                onChange={e => setSelectedKwIds(prev => e.target.checked ? [...prev, kw.id] : prev.filter(i => i !== kw.id))} />

                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    {statusIcon(kw.status)}
                                                                    <span className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate">{kw.keyword}</span>
                                                                    {cfg.providerOverride !== 'auto' && (
                                                                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{cfg.providerOverride}</Badge>
                                                                    )}
                                                                    {cfg.generateCover && (
                                                                        <span className="text-[10px] text-pink-400 font-medium flex items-center gap-0.5">
                                                                            <ImageIcon className="h-3 w-3" />cover
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Language dots */}
                                                            <div className="hidden md:flex items-center gap-px w-44 flex-wrap">
                                                                {ALL_LOCALES.map(l => {
                                                                    const enabled = cfg.languages.includes(l.code);
                                                                    const done = kw.status === 'completed';
                                                                    const fail = kw.status === 'failed';
                                                                    return (
                                                                        <span key={l.code} title={`${l.name}${enabled ? '' : ' (skipped)'}`}
                                                                            className={`text-sm ${enabled ? (done ? 'opacity-100' : fail ? 'opacity-25' : 'opacity-60') : 'opacity-10'}`}>
                                                                            {l.flag}
                                                                        </span>
                                                                    );
                                                                })}
                                                            </div>

                                                            <div className="w-24 flex justify-end shrink-0">{statusBadge(kw.status)}</div>

                                                            <div className="flex items-center gap-1 ml-1 shrink-0">
                                                                <button onClick={() => setExpandedConfig(isExpanded ? null : kw.id)}
                                                                    className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${isExpanded ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                                                    title="Settings">
                                                                    <Settings2 className="h-3.5 w-3.5" />
                                                                </button>
                                                                <button onClick={() => handleDeleteKeyword(kw.id)}
                                                                    className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors"
                                                                    title="Delete">
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Expanded settings panel */}
                                                        {isExpanded && (
                                                            <div className="px-4 pb-4 pt-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-slate-950/30 space-y-4">
                                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Override settings for this keyword only</p>
                                                                <LanguagePicker selected={cfg.languages} onChange={langs => setConfig(kw.id, { languages: langs })} />
                                                                <div className="flex flex-wrap gap-5 items-center border-t border-slate-100 dark:border-white/5 pt-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">AI Provider:</label>
                                                                        <select value={cfg.providerOverride} onChange={e => setConfig(kw.id, { providerOverride: e.target.value })}
                                                                            className="h-7 px-2 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs">
                                                                            <option value="auto">Auto</option>
                                                                            <option value="gemini">Gemini</option>
                                                                            <option value="groq">Groq (Free)</option>
                                                                            <option value="openai">OpenAI</option>
                                                                            <option value="claude">Claude</option>
                                                                        </select>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                                                                            <ImageIcon className="h-3.5 w-3.5 text-pink-400" /> Cover:
                                                                        </label>
                                                                        <Switch checked={cfg.generateCover} onCheckedChange={v => setConfig(kw.id, { generateCover: v })} className="scale-75" />
                                                                        <span className={`text-[10px] font-bold ${cfg.generateCover ? 'text-pink-500' : 'text-slate-400'}`}>{cfg.generateCover ? 'ON' : 'OFF'}</span>
                                                                    </div>
                                                                    <button onClick={() => setExpandedConfig(null)}
                                                                        className="ml-auto text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                                                                        <ChevronDown className="h-3.5 w-3.5" /> Collapse
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </Card>
                                )}

                                {/* ── Scheduler Panel ── */}
                                <Card className="border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm overflow-hidden mt-2">
                                    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-white/5 bg-gradient-to-r from-violet-50/50 to-indigo-50/50 dark:from-violet-900/10 dark:to-indigo-900/10">
                                        <div className="flex items-center gap-2">
                                            <CalendarClock className="h-4 w-4 text-violet-500" />
                                            <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Auto Scheduler</span>
                                            {cronSaving && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
                                        </div>
                                        <p className="text-[11px] text-slate-400">Configure external cron to hit <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">GET /api/cron/tick?secret=...</code> every 15 min</p>
                                    </div>

                                    <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-white/5">

                                        {/* Generation scheduler */}
                                        <div className="p-5 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Zap className={`h-4 w-4 ${cronConfig.generateEnabled ? 'text-violet-500' : 'text-slate-400'}`} />
                                                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">Generation Schedule</span>
                                                </div>
                                                <Switch
                                                    checked={!!cronConfig.generateEnabled}
                                                    onCheckedChange={v => saveCronConfig({
                                                        generateEnabled: v,
                                                        generateNextRun: v ? new Date(Date.now() + (cronConfig.generateIntervalHours || 6) * 3600_000).toISOString() : null,
                                                    })}
                                                />
                                            </div>

                                            <div className="flex items-center gap-3 flex-wrap">
                                                <label className="text-xs text-slate-500 font-medium">Every</label>
                                                <select
                                                    value={cronConfig.generateIntervalHours || 6}
                                                    onChange={e => saveCronConfig({ generateIntervalHours: Number(e.target.value) })}
                                                    className="h-8 px-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-sm font-semibold"
                                                >
                                                    <option value={1}>1 hour</option>
                                                    <option value={2}>2 hours</option>
                                                    <option value={4}>4 hours</option>
                                                    <option value={6}>6 hours</option>
                                                    <option value={12}>12 hours</option>
                                                    <option value={24}>1 day</option>
                                                    <option value={48}>2 days</option>
                                                    <option value={168}>7 days</option>
                                                </select>
                                                <span className="text-xs text-slate-400">per keyword</span>
                                            </div>

                                            {cronConfig.generateEnabled && (
                                                <div className="space-y-1 text-xs text-slate-500">
                                                    {cronConfig.generateNextRun && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Timer className="h-3.5 w-3.5 text-violet-400" />
                                                            <span>Next: <strong className="text-violet-600 dark:text-violet-400">{formatCountdown(cronConfig.generateNextRun, tick)}</strong></span>
                                                        </div>
                                                    )}
                                                    {cronConfig.generateLastRun && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            <span>Last: {new Date(cronConfig.generateLastRun).toLocaleString()}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <Button onClick={triggerGenerate} disabled={triggeringGen || generating} size="sm"
                                                className="h-8 px-4 gap-1.5 bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:hover:bg-violet-900/40 rounded-lg text-xs font-bold border-0">
                                                {triggeringGen ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                                Trigger Now
                                            </Button>
                                        </div>

                                        {/* Publish scheduler */}
                                        <div className="p-5 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <PlayCircle className={`h-4 w-4 ${cronConfig.publishEnabled ? 'text-green-500' : 'text-slate-400'}`} />
                                                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">Publishing Schedule</span>
                                                </div>
                                                <Switch
                                                    checked={!!cronConfig.publishEnabled}
                                                    onCheckedChange={v => saveCronConfig({
                                                        publishEnabled: v,
                                                        publishNextRun: v ? new Date(Date.now() + (cronConfig.publishIntervalHours || 12) * 3600_000).toISOString() : null,
                                                    })}
                                                />
                                            </div>

                                            <div className="flex items-center gap-3 flex-wrap">
                                                <label className="text-xs text-slate-500 font-medium">Every</label>
                                                <select
                                                    value={cronConfig.publishIntervalHours || 12}
                                                    onChange={e => saveCronConfig({ publishIntervalHours: Number(e.target.value) })}
                                                    className="h-8 px-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-sm font-semibold"
                                                >
                                                    <option value={1}>1 hour</option>
                                                    <option value={2}>2 hours</option>
                                                    <option value={4}>4 hours</option>
                                                    <option value={6}>6 hours</option>
                                                    <option value={12}>12 hours</option>
                                                    <option value={24}>1 day</option>
                                                    <option value={48}>2 days</option>
                                                    <option value={168}>7 days</option>
                                                </select>
                                                <label className="text-xs text-slate-500 font-medium">publish</label>
                                                <select
                                                    value={cronConfig.publishMaxPerRun || 1}
                                                    onChange={e => saveCronConfig({ publishMaxPerRun: Number(e.target.value) })}
                                                    className="h-8 px-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-sm font-semibold"
                                                >
                                                    <option value={1}>1 article</option>
                                                    <option value={2}>2 articles</option>
                                                    <option value={3}>3 articles</option>
                                                    <option value={5}>5 articles</option>
                                                    <option value={10}>10 articles</option>
                                                </select>
                                            </div>

                                            {cronConfig.publishEnabled && (
                                                <div className="space-y-1 text-xs text-slate-500">
                                                    {cronConfig.publishNextRun && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Timer className="h-3.5 w-3.5 text-green-400" />
                                                            <span>Next: <strong className="text-green-600 dark:text-green-400">{formatCountdown(cronConfig.publishNextRun, tick)}</strong></span>
                                                        </div>
                                                    )}
                                                    {cronConfig.publishLastRun && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            <span>Last: {new Date(cronConfig.publishLastRun).toLocaleString()}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1.5">
                                                        <FileText className="h-3.5 w-3.5" />
                                                        <span>{posts.filter(p => p.status === 'draft').length} drafts ready to publish</span>
                                                    </div>
                                                </div>
                                            )}

                                            <Button onClick={triggerPublish} disabled={triggeringPub} size="sm"
                                                className="h-8 px-4 gap-1.5 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/40 rounded-lg text-xs font-bold border-0">
                                                {triggeringPub ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                                Trigger Now
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {/* ── SEO CONTENT BLOCK TAB ── */}
                        {activeTab === 'seo' && (
                            <div className="space-y-5">
                                {/* Header card */}
                                <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm space-y-5">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <h3 className="font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                                <LayoutDashboard className="h-5 w-5 text-indigo-500" />
                                                Homepage SEO Content Block
                                            </h3>
                                            <p className="text-sm text-slate-500">
                                                Write HTML content displayed below the main tool on the homepage.
                                                Use headings, paragraphs, lists, and tables for rich SEO structure.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <button
                                                onClick={() => setSeoEnabled(v => !v)}
                                                className={`flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-lg border transition-all ${seoEnabled
                                                    ? 'border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:border-green-500/30 dark:text-green-400'
                                                    : 'border-slate-200 bg-slate-50 text-slate-500 dark:bg-slate-800 dark:border-white/10'
                                                    }`}
                                            >
                                                {seoEnabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                                                {seoEnabled ? 'Visible' : 'Hidden'}
                                            </button>
                                            <button
                                                onClick={() => setSeoShowDefault(v => !v)}
                                                className={`flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-lg border transition-all ${seoShowDefault
                                                    ? 'border-violet-200 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:border-violet-500/30 dark:text-violet-400'
                                                    : 'border-slate-200 bg-slate-50 text-slate-500 dark:bg-slate-800 dark:border-white/10'
                                                    }`}
                                            >
                                                {seoShowDefault ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                                                {seoShowDefault ? 'Show Default' : 'Default Hidden'}
                                            </button>
                                            <button
                                                onClick={() => setSeoPreview(v => !v)}
                                                className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                            >
                                                {seoPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                {seoPreview ? 'Edit' : 'Preview'}
                                            </button>
                                            <Button
                                                onClick={handleSaveSeoContent}
                                                disabled={savingSeo}
                                                className="h-9 px-5 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 rounded-xl"
                                            >
                                                {savingSeo ? <Loader2 className="h-4 w-4 animate-spin" /> : seoSaved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                                                {savingSeo ? 'Saving...' : seoSaved ? 'Saved!' : 'Save'}
                                            </Button>
                                        </div>
                                    </div>

                                    {seoLoading ? (
                                        <div className="flex justify-center py-12">
                                            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                                        </div>
                                    ) : seoPreview ? (
                                        /* Live preview */
                                        <div
                                            className="
                                                min-h-[300px] p-5 rounded-xl border border-slate-200 dark:border-white/10
                                                bg-white dark:bg-slate-950
                                                prose prose-slate dark:prose-invert max-w-none
                                                prose-h2:text-xl prose-h2:font-bold prose-h2:mt-5 prose-h2:mb-2
                                                prose-h3:text-base prose-h3:font-semibold prose-h3:mt-4 prose-h3:mb-1
                                                prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-p:leading-relaxed
                                                prose-ul:space-y-1 prose-li:text-slate-600 dark:prose-li:text-slate-400
                                                prose-table:text-sm
                                                prose-th:text-left prose-th:font-semibold prose-th:py-2 prose-th:px-3 prose-th:bg-slate-50 dark:prose-th:bg-slate-900
                                                prose-td:py-2 prose-td:px-3
                                            "
                                            dangerouslySetInnerHTML={{ __html: seoHtml || '<p class="text-slate-400 italic">Nothing to preview. Add HTML content in the editor.</p>' }}
                                        />
                                    ) : (
                                        /* HTML Editor */
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">HTML Editor</span>
                                                <span className="text-[10px] text-slate-400 ml-auto">
                                                    Supports: &lt;h2&gt;&lt;h3&gt;&lt;p&gt;&lt;ul&gt;&lt;li&gt;&lt;strong&gt;&lt;table&gt;&lt;tr&gt;&lt;td&gt;&lt;th&gt;&lt;section&gt; etc.
                                                </span>
                                            </div>
                                            <textarea
                                                className="w-full min-h-[420px] p-4 rounded-xl bg-slate-950 border border-slate-200 dark:border-white/10 text-sm font-mono text-green-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-y leading-relaxed"
                                                placeholder={`<section>\n  <h2>Your SEO Heading</h2>\n  <p>Your SEO description...</p>\n</section>`}
                                                value={seoHtml}
                                                onChange={e => setSeoHtml(e.target.value)}
                                                spellCheck={false}
                                            />
                                            <p className="text-[10px] text-slate-400">
                                                💡 Tip: Leave the editor empty to display the built-in default content.
                                                Toggle <strong>Preview</strong> above to see the rendered output.
                                            </p>
                                        </div>
                                    )}
                                </Card>

                                {/* Quick reference card */}
                                <Card className="p-5 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">HTML Quick Reference</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {[
                                            { tag: '<h2>Title</h2>', desc: 'Section heading (H2)' },
                                            { tag: '<h3>Subtitle</h3>', desc: 'Subsection heading (H3)' },
                                            { tag: '<p>Text here</p>', desc: 'Paragraph' },
                                            { tag: '<strong>bold</strong>', desc: 'Bold/emphasis' },
                                            { tag: '<ul><li>item</li></ul>', desc: 'Bullet list' },
                                            { tag: '<table><tr><th>H</th></tr><tr><td>D</td></tr></table>', desc: 'Data table' },
                                        ].map(({ tag, desc }) => (
                                            <div key={tag} className="flex flex-col gap-0.5">
                                                <code className="text-[10px] bg-slate-100 dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-md font-mono break-all">{tag}</code>
                                                <span className="text-[10px] text-slate-400">{desc}</span>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        )}

                        {/* ── LINK/TEXT REPLACER TAB ── */}
                        {activeTab === 'replacer' && (
                            <div className="space-y-6">
                                <Card className="p-8 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm space-y-8">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                            <Replace className="h-6 w-6 text-orange-500" />
                                            Link & Text Replacer
                                        </h3>
                                        <p className="text-sm text-slate-500 max-w-2xl">
                                            Perform bulk &quot;Search and Replace&quot; operations across all blog posts.
                                            Useful for updating broken links, changing company names, or fixing common typos.
                                            <strong> Caution:</strong> This directly modifies the database.
                                        </p>
                                    </div>

                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Exact text to find</label>
                                            <Input
                                                placeholder="e.g. old-link.com/page"
                                                value={findText}
                                                onChange={e => setFindText(e.target.value)}
                                                className="h-12 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 rounded-xl"
                                            />
                                            <p className="text-[10px] text-slate-400">Cases sensitive exact match.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Replacement text</label>
                                            <Input
                                                placeholder="e.g. new-link.io/page"
                                                value={replaceWith}
                                                onChange={e => setReplaceWith(e.target.value)}
                                                className="h-12 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 rounded-xl"
                                            />
                                            <p className="text-[10px] text-slate-400">Leave empty to remove the text entirely.</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
                                        <Button
                                            variant="outline"
                                            onClick={() => handleReplaceText(true)}
                                            disabled={replacing || !findText}
                                            className="h-11 px-6 rounded-xl border-slate-200 hover:bg-slate-50 gap-2 font-bold"
                                        >
                                            {replacing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                            Preview Matches
                                        </Button>

                                        <Button
                                            onClick={() => handleReplaceText(false)}
                                            disabled={replacing || !findText}
                                            className="h-11 px-8 rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20 gap-2 font-bold"
                                        >
                                            {replacing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                                            Replace in All Articles
                                        </Button>

                                        {replacerResult && (
                                            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border animate-in fade-in zoom-in duration-300 ${replacerResult.error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                }`}>
                                                {replacerResult.error ? (
                                                    <><XCircle className="h-4 w-4" /> {replacerResult.error}</>
                                                ) : (
                                                    <>
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        {replacerResult.dryRun
                                                            ? `Found ${replacerResult.affectedCount} matches in ${posts.length} articles.`
                                                            : `Successfully updated ${replacerResult.affectedCount} articles.`}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Warnings */}
                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl flex gap-3 italic">
                                        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                                        <div className="text-xs text-amber-800 dark:text-amber-400 space-y-1">
                                            <p>This tool performs a <strong>case-sensitive</strong> exact string replacement. It affects both the article content and the excerpt (meta description).</p>
                                            <p>It is highly recommended to use the <strong>Preview</strong> button first to see how many articles will be affected.</p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Bulk Actions Bar (posts) */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <Card className="bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-6 py-4 flex items-center gap-6 shadow-2xl rounded-2xl border-none">
                        <div className="flex flex-col">
                            <span className="text-sm font-bold">{selectedIds.length} articles selected</span>
                            <span className="text-[10px] opacity-60 uppercase tracking-widest font-bold">Bulk Actions</span>
                        </div>
                        <div className="h-8 w-px bg-white/20 dark:bg-slate-900/20" />
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" className="text-white hover:bg-white/10 dark:text-slate-950 dark:hover:bg-slate-100 font-bold" onClick={() => setSelectedIds([])}>
                                Cancel
                            </Button>
                            <Button disabled={isBulkDeleting} className="bg-rose-500 hover:bg-rose-600 text-white border-none rounded-xl px-6 font-bold gap-2" onClick={handleBulkDelete}>
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
