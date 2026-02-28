'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    CheckCircle2,
    Circle,
    LayoutGrid,
    Table as TableIcon,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

interface DocArticle {
    id: number;
    slug: string;
    title: string;
    section: string;
    published: boolean;
    created_at: string;
    locale: string;
}

export default function AdminDocsPage() {
    const t = useTranslations('Admin');
    const td = useTranslations('Docs');
    const [articles, setArticles] = useState<DocArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [localeFilter, setLocaleFilter] = useState<string>('all');

    useEffect(() => {
        fetchArticles();
    }, []);

    async function fetchArticles() {
        try {
            const res = await fetch('/api/admin/docs');
            if (res.ok) {
                const data = await res.json();
                setArticles(data);
            }
        } catch (error) {
            console.error('Failed to fetch articles:', error);
        } finally {
            setLoading(false);
        }
    }

    async function deleteArticle(id: number) {
        if (!confirm('Are you sure you want to delete this article?')) return;

        try {
            const res = await fetch(`/api/admin/docs/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setArticles(articles.filter(a => a.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete article:', error);
        }
    }

    const filteredArticles = articles.filter(a => {
        const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) ||
            a.slug.toLowerCase().includes(search.toLowerCase()) ||
            a.section.toLowerCase().includes(search.toLowerCase());
        const matchLocale = localeFilter === 'all' || a.locale === localeFilter;
        return matchSearch && matchLocale;
    });

    return (
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                <AdminSidebar />
                <div className="flex-1 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Documentation Management</h1>
                            <p className="text-slate-500 mt-1">Create, edit and organize your knowledge base articles</p>
                        </div>
                        <Link href="/admin/docs/editor">
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-indigo-500/20 border-none transition-all hover:scale-[1.02] active:scale-[0.98]">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Article
                            </Button>
                        </Link>
                    </div>

                    <Card className="p-4 border-slate-200 dark:border-white/5 bg-white dark:bg-white/5 shadow-sm rounded-2xl">
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search by title, slug or section..."
                                    className="pl-10 h-11 border-slate-200 dark:border-white/10 dark:bg-slate-900/50 rounded-xl"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={localeFilter}
                                    onChange={(e) => setLocaleFilter(e.target.value)}
                                    className="h-11 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value="all">All Languages</option>
                                    <option value="en">🇬🇧 English</option>
                                    <option value="uk">🇺🇦 Ukrainian</option>
                                    <option value="es">🇪🇸 Spanish</option>
                                    <option value="de">🇩🇪 German</option>
                                    <option value="fr">🇫🇷 French</option>
                                    <option value="ru">🇷🇺 Russian</option>
                                    <option value="nl">🇳🇱 Dutch</option>
                                    <option value="pl">🇵🇱 Polish</option>
                                    <option value="it">🇮🇹 Italian</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    {loading ? (
                        <div className="flex items-center justify-center p-20">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    ) : filteredArticles.length === 0 ? (
                        <Card className="p-20 text-center border-dashed border-2 border-slate-200 dark:border-white/5 bg-transparent rounded-3xl">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 mb-4">
                                <LayoutGrid className="w-6 h-6 text-slate-400" />
                            </div>
                            <p className="text-slate-500">No articles found matching your criteria.</p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredArticles.map((article) => (
                                <Card key={article.id} className="p-5 border-slate-200 dark:border-white/5 bg-white dark:bg-white/10 hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-all group rounded-2xl shadow-sm hover:shadow-md">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-5 min-w-0">
                                            <div className={`p-3 rounded-xl ${article.published ? 'bg-green-500/10 text-green-600' : 'bg-slate-500/10 text-slate-500'}`}>
                                                {article.published ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xl mr-1" title={article.locale}>
                                                        {article.locale === 'uk' ? '🇺🇦' : article.locale === 'en' ? '🇬🇧' : '🌐'}
                                                    </span>
                                                    <h3 className="font-bold text-slate-900 dark:text-white truncate text-lg">{article.title}</h3>
                                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-600 border border-blue-500/10">
                                                        {td(`sections.${article.section}`) || article.section}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                                                    <span className="font-mono bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded text-indigo-500">/{article.slug}</span>
                                                    <span className="opacity-30">•</span>
                                                    <span>{new Date(article.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Link href={`/docs/${article.slug}`} target="_blank">
                                                <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-blue-50 text-blue-600 dark:hover:bg-blue-500/10 rounded-xl">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <Link href={`/admin/docs/editor?id=${article.id}`}>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl">
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 hover:bg-red-500/10 hover:text-red-500 text-slate-400 rounded-xl"
                                                onClick={() => deleteArticle(article.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
