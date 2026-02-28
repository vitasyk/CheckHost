'use client';

import { useState, useRef } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Copy,
    CheckCircle2,
    Upload,
    FileText,
    Code2,
    Save,
    Loader2,
    Sparkles,
    ArrowLeft,
    Globe,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { marked } from 'marked';

const LOCALES: { code: string; label: string }[] = [
    { code: 'en', label: '🇺🇸 English' },
    { code: 'uk', label: '🇺🇦 Ukrainian' },
    { code: 'ru', label: '🇷🇺 Russian' },
    { code: 'es', label: '🇪🇸 Spanish' },
    { code: 'de', label: '🇩🇪 German' },
    { code: 'fr', label: '🇫🇷 French' },
    { code: 'nl', label: '🇳🇱 Dutch' },
    { code: 'pl', label: '🇵🇱 Polish' },
    { code: 'it', label: '🇮🇹 Italian' },
];

const LANG_NAMES: Record<string, string> = {
    en: 'English', uk: 'Ukrainian', ru: 'Russian', es: 'Spanish',
    de: 'German', fr: 'French', nl: 'Dutch', pl: 'Polish', it: 'Italian',
};

const FORMAT_TABS = [
    { id: 'html', label: 'HTML', icon: Code2 },
    { id: 'md', label: 'Markdown', icon: FileText },
    { id: 'txt', label: 'Plain Text', icon: FileText },
] as const;

type Format = 'html' | 'md' | 'txt';

function generatePrompt(topic: string, locale: string): string {
    const lang = LANG_NAMES[locale] || 'English';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://checknode.io';
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'CheckNode';
    return `You are a senior DevOps engineer and SEO content expert.

Write a comprehensive, technically accurate, SEO-optimized blog article about: "${topic}"

LANGUAGE: Write the ENTIRE article in ${lang} (title, headings, body — everything).

Return ONLY the article body as rich HTML (no <html>/<body> wrap). Use:
- <h2> and <h3> for section headings
- <ul>, <ol>, <li> for lists  
- <strong> for key terms, <code> for commands/snippets
- At least one <img src="URL" alt="descriptive text"> (use: https://placehold.co/800x400/1e293b/818cf8?text=Topic+Diagram)
- Never leave the alt attribute empty

Naturally mention ${siteName} tools where relevant (Ping, HTTP Check, DNS Check, SSL Check, MTR). 
Link format: <a href="${siteUrl}/ping">Ping Check</a>

Target length: 1200–2000 words.`;
}

function convertToHtml(content: string, format: Format): string {
    if (format === 'html') return content;
    if (format === 'md') {
        try {
            return marked.parse(content) as string;
        } catch {
            return `<pre>${content}</pre>`;
        }
    }
    // Plain text: wrap each paragraph in <p>
    return content
        .split(/\n{2,}/)
        .map(para => `<p>${para.replace(/\n/g, '<br/>')}</p>`)
        .join('\n');
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

export default function BlogImportPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Topic / prompt state
    const [topic, setTopic] = useState('');
    const [locale, setLocale] = useState('en');
    const [promptCopied, setPromptCopied] = useState(false);

    // Content state
    const [format, setFormat] = useState<Format>('html');
    const [rawContent, setRawContent] = useState('');
    const [fileName, setFileName] = useState('');

    // Post metadata
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [excerpt, setExcerpt] = useState('');

    // Save state
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    const generatedPrompt = topic.trim() ? generatePrompt(topic, locale) : '';

    const handleCopyPrompt = () => {
        if (!generatedPrompt) return;
        navigator.clipboard.writeText(generatedPrompt);
        setPromptCopied(true);
        setTimeout(() => setPromptCopied(false), 2500);
    };

    const handleTitleChange = (val: string) => {
        setTitle(val);
        if (!slug || slug === slugify(title)) {
            setSlug(slugify(val));
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'md') setFormat('md');
        else if (ext === 'txt') setFormat('txt');
        else setFormat('html');

        const text = await file.text();
        setRawContent(text);

        // Auto-fill title from first line if empty
        if (!title) {
            const firstLine = text.split('\n')[0]
                .replace(/^#+\s*/, '')  // strip markdown heading #
                .replace(/<[^>]+>/g, '') // strip html tags
                .trim();
            if (firstLine.length > 0 && firstLine.length < 120) {
                setTitle(firstLine);
                setSlug(slugify(firstLine));
            }
        }
        // Reset file input so same file can be re-uploaded if needed
        e.target.value = '';
    };

    const handleSave = async () => {
        if (!title.trim()) { setError('Title is required'); return; }
        if (!rawContent.trim()) { setError('Content is required'); return; }
        if (!slug.trim()) { setError('Slug is required'); return; }

        setError('');
        setSaving(true);

        const htmlContent = convertToHtml(rawContent, format);
        const finalSlug = locale !== 'en' ? `${slug}-${locale}` : slug;

        try {
            const res = await fetch('/api/admin/blog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    slug: finalSlug,
                    excerpt: excerpt || title,
                    content: htmlContent,
                    status: 'draft',
                    ad_top: true,
                    ad_bottom: true,
                    author: 'Manual Import',
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Save failed');
            }

            setSaved(true);
            setTimeout(() => router.push('/admin/blog'), 1500);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
            <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                    <AdminSidebar />

                    <main className="flex-1 space-y-6">
                        {/* Header */}
                        <div className="flex items-center gap-4">
                            <Link href="/admin/blog">
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </Link>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    <Upload className="h-6 w-6 text-violet-500" />
                                    Manual Content Import
                                </h2>
                                <p className="text-slate-500 text-sm mt-0.5">Generate prompt → use your AI subscription → paste or upload the result here</p>
                            </div>
                        </div>

                        {/* Step 1: Generate Prompt */}
                        <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 font-bold text-sm">1</div>
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-violet-500" />
                                    Generate Prompt
                                </h3>
                                <Badge variant="secondary" className="text-[10px]">Copy to ChatGPT / Gemini / Claude</Badge>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-2 space-y-1">
                                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Topic / Keyword</label>
                                    <Input
                                        value={topic}
                                        onChange={e => setTopic(e.target.value)}
                                        placeholder="e.g. how to check ping online"
                                        className="bg-slate-50 dark:bg-slate-950"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1"><Globe className="h-3 w-3" /> Language</label>
                                    <select
                                        value={locale}
                                        onChange={e => setLocale(e.target.value)}
                                        className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                                    >
                                        {LOCALES.map(l => (
                                            <option key={l.code} value={l.code}>{l.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {generatedPrompt && (
                                <div className="relative">
                                    <pre className="text-xs font-mono bg-slate-950 text-slate-300 p-4 rounded-xl overflow-auto max-h-52 whitespace-pre-wrap leading-relaxed">
                                        {generatedPrompt}
                                    </pre>
                                    <Button
                                        onClick={handleCopyPrompt}
                                        size="sm"
                                        className={`absolute top-3 right-3 h-8 gap-1.5 text-xs font-bold rounded-lg transition-all ${promptCopied
                                            ? 'bg-green-600 text-white'
                                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10'
                                            }`}
                                    >
                                        {promptCopied ? <><CheckCircle2 className="h-3.5 w-3.5" /> Copied!</> : <><Copy className="h-3.5 w-3.5" /> Copy Prompt</>}
                                    </Button>
                                </div>
                            )}

                            {!generatedPrompt && (
                                <div className="text-sm text-slate-400 italic">Enter a topic above to generate a ready-to-use prompt.</div>
                            )}
                        </Card>

                        {/* Step 2: Paste / Upload Content */}
                        <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold text-sm">2</div>
                                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">Paste or Upload Content</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Format selector */}
                                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg gap-0.5">
                                        {FORMAT_TABS.map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setFormat(tab.id)}
                                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${format === tab.id
                                                    ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white'
                                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                                    }`}
                                            >
                                                <tab.icon className="h-3 w-3" />
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                    {/* File upload */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".html,.htm,.md,.txt"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="h-8 gap-1.5 text-xs border-dashed"
                                    >
                                        <Upload className="h-3.5 w-3.5" />
                                        Upload File
                                    </Button>
                                </div>
                            </div>

                            {fileName && (
                                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/5">
                                    <FileText className="h-3.5 w-3.5 text-indigo-500" />
                                    Loaded from file: <span className="font-mono font-bold">{fileName}</span>
                                </div>
                            )}

                            <textarea
                                className="w-full min-h-[280px] p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-y leading-relaxed"
                                placeholder={
                                    format === 'html'
                                        ? '<h2>Introduction</h2>\n<p>Paste your HTML content here...</p>'
                                        : format === 'md'
                                            ? '## Introduction\n\nPaste your Markdown content here...'
                                            : 'Paste your plain text content here...'
                                }
                                value={rawContent}
                                onChange={e => setRawContent(e.target.value)}
                            />
                            <p className="text-[11px] text-slate-400">
                                {format === 'md' && '📝 Markdown will be auto-converted to HTML when saving.'}
                                {format === 'txt' && '📝 Plain text paragraphs will be wrapped in <p> tags when saving.'}
                                {format === 'html' && '📝 HTML will be saved as-is.'}
                                {' '}Supports .html, .htm, .md, .txt file upload.
                            </p>
                        </Card>

                        {/* Step 3: Metadata */}
                        <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 font-bold text-sm">3</div>
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Article Metadata</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Title *</label>
                                    <Input
                                        value={title}
                                        onChange={e => handleTitleChange(e.target.value)}
                                        placeholder="Article title..."
                                        className="bg-slate-50 dark:bg-slate-950"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Slug (URL) *</label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={slug}
                                            onChange={e => setSlug(slugify(e.target.value))}
                                            placeholder="article-url-slug"
                                            className="bg-slate-50 dark:bg-slate-950 font-mono text-sm"
                                        />
                                        {locale !== 'en' && (
                                            <Badge variant="secondary" className="whitespace-nowrap text-[10px] font-mono">-{locale}</Badge>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400">Final URL: /blog/{slug}{locale !== 'en' ? `-${locale}` : ''}</p>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Excerpt / Meta Description</label>
                                <textarea
                                    className="w-full min-h-[80px] p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40 resize-y"
                                    placeholder="Short description for SEO and cards (optional, will use title if empty)..."
                                    value={excerpt}
                                    onChange={e => setExcerpt(e.target.value)}
                                />
                            </div>

                            {/* Save Section */}
                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-sm text-red-600 dark:text-red-400">
                                    ⚠️ {error}
                                </div>
                            )}

                            <div className="flex items-center gap-3 pt-2">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving || saved}
                                    className={`h-11 px-8 gap-2 text-sm font-bold rounded-xl shadow-lg transition-all ${saved
                                        ? 'bg-green-600 text-white shadow-green-500/20'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                                        }`}
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                                    {saving ? 'Saving...' : saved ? 'Saved! Redirecting...' : 'Save as Draft'}
                                </Button>
                                <p className="text-xs text-slate-400">Article will be saved as <strong>Draft</strong>. You can review and publish from Blog Management.</p>
                            </div>
                        </Card>
                    </main>
                </div>
            </div>
        </div>
    );
}
