
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

const ALLOWED_FILES = [
    { name: 'robots.txt', label: 'Robots.txt (SEO)', description: 'Керування пошуковими роботами' },
    { name: 'ads.txt', label: 'Ads.txt (AdSense)', description: 'Авторизація рекламних продавців' },
    { name: 'security.txt', label: 'Security.txt', description: 'Контакти з безпеки' }
];

export function FileEditor() {
    const [selectedFile, setSelectedFile] = useState(ALLOWED_FILES[0].name);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    const fetchFileContent = async (fileName: string) => {
        setLoading(true);
        setError(null);
        setSaved(false);
        try {
            const res = await fetch(`/api/admin/files?file=${fileName}`);
            const data = await res.json();
            if (res.ok) {
                setContent(data.content);
            } else {
                setError(data.error || 'Failed to load file');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFileContent(selectedFile);
    }, [selectedFile]);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSaved(false);
        try {
            const res = await fetch('/api/admin/files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file: selectedFile, content })
            });
            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to save');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="h-5 w-5 text-indigo-500" />
                        System File Editor
                    </h3>
                    <p className="text-sm text-slate-500">Редагування службових файлів у папці /public</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        className="h-10 px-3 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none"
                        value={selectedFile}
                        onChange={(e) => setSelectedFile(e.target.value)}
                        disabled={loading || saving}
                    >
                        {ALLOWED_FILES.map(f => (
                            <option key={f.name} value={f.name}>{f.label}</option>
                        ))}
                    </select>
                    <Button
                        onClick={handleSave}
                        disabled={loading || saving}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-indigo-500/20"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                        {saving ? 'Збереження...' : saved ? 'Збережено!' : 'Зберегти'}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            )}

            <div className="relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-md">
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                    </div>
                )}
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full min-h-[300px] p-4 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 font-mono text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none resize-y"
                    placeholder={`Вміст ${selectedFile}...`}
                    spellCheck={false}
                />
            </div>

            <p className="text-[11px] text-slate-400">
                {ALLOWED_FILES.find(f => f.name === selectedFile)?.description}
            </p>
        </Card>
    );
}
