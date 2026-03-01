'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Save,
    ChevronLeft,
    Eye,
    Edit3,
    Settings,
    Type,
    Link as LinkIcon,
    Layers,
    History,
    FileText,
    Loader2,
    BookOpen,
    ArrowLeft,
    CheckCircle2,
    Circle,
    Upload,
    Image as ImageIcon,
    Sparkles
} from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

function EditorContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const articleId = searchParams.get('id');
    const t = useTranslations('Admin');

    const [loading, setLoading] = useState(!!articleId);
    const [saving, setSaving] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [generatingCover, setGeneratingCover] = useState(false);
    const [imageModel, setImageModel] = useState<'dall-e-3' | 'dall-e-2' | 'gpt-image-1'>('dall-e-3');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        content: '',
        section: 'General',
        order_index: 0,
        published: false,
        cover_image: '',
        locale: 'en'
    });

    useEffect(() => {
        if (articleId) {
            fetchArticle();
        }
    }, [articleId]);

    async function fetchArticle() {
        try {
            const res = await fetch(`/api/admin/docs`);
            const data = await res.json();
            const found = data.find((a: any) => a.id.toString() === articleId);
            if (found) {
                setFormData({
                    title: found.title,
                    slug: found.slug,
                    content: found.content,
                    section: found.section,
                    order_index: found.order_index,
                    published: found.published,
                    cover_image: found.cover_image || '',
                    locale: found.locale || 'en'
                });
            }
        } catch (error) {
            console.error('Failed to fetch article:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;
        setFormData(prev => ({
            ...prev,
            title,
            slug: articleId ? prev.slug : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        }));
    };

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingCover(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.url) {
                setFormData(prev => ({ ...prev, cover_image: data.url }));
            } else {
                alert(data.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Failed to upload image:', error);
            alert('Upload failed');
        } finally {
            setUploadingCover(false);
        }
    };

    const handleGenerateImage = async () => {
        if (!formData.title) {
            alert('Please enter a title first to generate a relevant image.');
            return;
        }

        setGeneratingCover(true);
        try {
            const res = await fetch('/api/admin/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: formData.title, model: imageModel })
            });
            const data = await res.json();
            if (data.url) {
                setFormData(prev => ({ ...prev, cover_image: data.url }));
            } else {
                alert(data.error || 'Generation failed');
            }
        } catch (error) {
            console.error('Failed to generate image:', error);
            alert('Generation failed');
        } finally {
            setGeneratingCover(false);
        }
    };

    async function handleSave() {
        setSaving(true);
        try {
            const url = articleId ? `/api/admin/docs/${articleId}` : '/api/admin/docs';
            const method = articleId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                router.push('/admin/docs');
                router.refresh();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to save article');
            }
        } catch (error) {
            console.error('Failed to save:', error);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
            <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                    <AdminSidebar />

                    <main className="flex-1 space-y-8">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-200 dark:hover:bg-white/5" onClick={() => router.back()}>
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                                        {articleId ? 'Edit Article' : 'Create New Article'}
                                    </h1>
                                    <p className="text-sm text-slate-500 mt-1">
                                        {articleId ? 'Update your documentation content and settings.' : 'Draft a new guide or technical article.'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => window.open(`/docs/${formData.slug}`, '_blank')}
                                    className="h-10 gap-2 px-5 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                                >
                                    <Eye className="w-4 h-4" /> Preview
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="h-10 gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 px-6 rounded-xl font-bold"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {t('common.saveChanges')}
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                            <div className="xl:col-span-2 space-y-6">
                                <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm rounded-2xl">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                                                <Type className="w-5 h-5" />
                                            </div>
                                            <Input
                                                placeholder="Article Title"
                                                value={formData.title}
                                                onChange={handleTitleChange}
                                                className="text-2xl font-bold border-none shadow-none focus-visible:ring-0 px-0 bg-transparent h-auto py-0"
                                            />
                                        </div>
                                        <hr className="border-slate-100 dark:border-white/5" />

                                        <div>
                                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 block">Content</label>
                                            <RichTextEditor
                                                value={formData.content}
                                                onChange={(html) => setFormData(prev => ({ ...prev, content: html }))}
                                                placeholder="Write your article here..."
                                                minHeight={600}
                                            />
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            <div className="space-y-6">
                                <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm rounded-2xl space-y-6">
                                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Settings className="w-4 h-4 text-blue-500" /> Article Settings
                                    </h3>

                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Url Slug</Label>
                                            <div className="relative group">
                                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                                <Input
                                                    placeholder="article-slug"
                                                    value={formData.slug}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                                    className="pl-10 h-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 rounded-xl"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Section</Label>
                                            <div className="relative group">
                                                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" />
                                                <select
                                                    value={formData.section}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                                                    className="w-full h-10 pl-10 pr-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none transition-all"
                                                >
                                                    <option value="General">General</option>
                                                    <option value="Guides">Guides</option>
                                                    <option value="API">API Reference</option>
                                                    <option value="Network">Network & Nodes</option>
                                                    <option value="FAQ">FAQ</option>
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                    <ChevronLeft className="w-4 h-4 rotate-270" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Display Order</Label>
                                            <Input
                                                type="number"
                                                value={formData.order_index}
                                                onChange={(e) => setFormData(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
                                                className="h-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Language</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { code: 'en', label: 'English' },
                                                    { code: 'uk', label: 'Ukrainian' },
                                                    { code: 'es', label: 'Spanish' },
                                                    { code: 'de', label: 'German' },
                                                    { code: 'fr', label: 'French' },
                                                    { code: 'ru', label: 'Russian' },
                                                    { code: 'nl', label: 'Dutch' },
                                                    { code: 'pl', label: 'Polish' },
                                                    { code: 'it', label: 'Italian' }
                                                ].map((l) => (
                                                    <button
                                                        key={l.code}
                                                        type="button"
                                                        onClick={() => setFormData(p => ({ ...p, locale: l.code }))}
                                                        className={`py-1.5 px-2 text-[10px] font-bold rounded-lg border transition-all ${formData.locale === l.code
                                                            ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800'
                                                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 dark:bg-slate-950 dark:border-white/5'
                                                            }`}
                                                    >
                                                        {l.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 pt-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cover Image</Label>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1 group">
                                                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                                    <Input
                                                        placeholder="Image URL"
                                                        value={formData.cover_image}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, cover_image: e.target.value }))}
                                                        className="pl-10 h-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 rounded-xl text-xs"
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-10 w-10 shrink-0 border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-slate-950 text-pink-500 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/10"
                                                    onClick={handleGenerateImage}
                                                    disabled={generatingCover || uploadingCover}
                                                    title="Generate with AI"
                                                >
                                                    {generatingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-10 w-10 shrink-0 border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-slate-950"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={uploadingCover || generatingCover}
                                                    title="Upload File"
                                                >
                                                    {uploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                                </Button>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleCoverUpload}
                                                    accept="image/*"
                                                    className="hidden"
                                                />
                                            </div>
                                            {/* AI Model Selector */}
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Model:</span>
                                                <div className="flex gap-1 flex-wrap">
                                                    {([
                                                        { value: 'dall-e-3', label: 'DALL·E 3', badge: 'HD' },
                                                        { value: 'dall-e-2', label: 'DALL·E 2', badge: 'Fast' },
                                                        { value: 'gpt-image-1', label: 'GPT Image', badge: 'New' },
                                                    ] as const).map(({ value, label, badge }) => (
                                                        <button
                                                            key={value}
                                                            type="button"
                                                            onClick={() => setImageModel(value)}
                                                            className={`flex items-center gap-1 py-0.5 px-1.5 rounded-md border text-[9px] font-bold transition-all ${imageModel === value
                                                                ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                                                                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 dark:bg-slate-950 dark:border-white/5'
                                                                }`}
                                                        >
                                                            {label}
                                                            <span className={`text-[7px] px-0.5 rounded font-black ${imageModel === value
                                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40'
                                                                : 'bg-slate-100 text-slate-400 dark:bg-slate-700'
                                                                }`}>{badge}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            {formData.cover_image && (
                                                <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 aspect-video relative group bg-slate-100 dark:bg-slate-800">
                                                    <img src={formData.cover_image} alt="Cover" className="object-cover w-full h-full" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-4 mt-2 border-t border-slate-100 dark:border-white/5">
                                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-white/10">
                                                <div className="space-y-0.5">
                                                    <Label className="font-bold text-slate-900 dark:text-white">Published</Label>
                                                    <p className="text-[10px] text-slate-500">Live on public site</p>
                                                </div>
                                                <Switch
                                                    checked={formData.published}
                                                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, published: v }))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm rounded-2xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <History className="w-4 h-4 text-emerald-500" /> Article Status
                                        </h3>
                                        {formData.published ? (
                                            <Badge className="bg-green-500/10 text-green-600 border-none px-2 text-[10px]">ACTIVE</Badge>
                                        ) : (
                                            <Badge className="bg-slate-500/10 text-slate-500 border-none px-2 text-[10px]">DRAFT</Badge>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <div className={`p-1 rounded-full ${formData.published ? 'bg-green-500' : 'bg-slate-300'}`} />
                                            <span>Visibility: {formData.published ? 'Public' : 'Hidden'}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 italic">
                                            {articleId ? 'Last saved just now' : 'Not saved yet'}
                                        </p>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}

// Wrapper for Suspense (needed for useSearchParams)
export default function AdminDocsEditorPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-20"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>}>
            <EditorContent />
        </Suspense>
    );
}
