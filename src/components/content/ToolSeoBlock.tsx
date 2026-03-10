import React from 'react';
import { useTranslations } from 'next-intl';
import {
    Activity, Globe2, Search, Network, Server, ShieldCheck, Map as MapIcon,
    Lightbulb, Gauge, Earth, CheckCircle2, Info, Mail
} from 'lucide-react';

interface ToolSeoBlockProps {
    toolId: string;
}

// Map tool IDs to specific colors and icons
const toolStyles: Record<string, { icon: React.ElementType, gradient: string, lightBg: string, text: string, border: string, badgeBg: string }> = {
    'ping': { icon: Activity, gradient: 'from-blue-500 to-cyan-500', lightBg: 'bg-blue-50/50 dark:bg-blue-900/5', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-100 dark:border-blue-900/30', badgeBg: 'bg-blue-100 dark:bg-blue-500/10' },
    'http': { icon: Globe2, gradient: 'from-violet-500 to-purple-500', lightBg: 'bg-violet-50/50 dark:bg-violet-900/5', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-100 dark:border-violet-900/30', badgeBg: 'bg-violet-100 dark:bg-violet-500/10' },
    'dns': { icon: Search, gradient: 'from-emerald-500 to-teal-500', lightBg: 'bg-emerald-50/50 dark:bg-emerald-900/5', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-900/30', badgeBg: 'bg-emerald-100 dark:bg-emerald-500/10' },
    'mtr': { icon: Network, gradient: 'from-orange-500 to-amber-500', lightBg: 'bg-orange-50/50 dark:bg-orange-900/5', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-100 dark:border-orange-900/30', badgeBg: 'bg-orange-100 dark:bg-orange-500/10' },
    'tcpUdp': { icon: Server, gradient: 'from-rose-500 to-pink-500', lightBg: 'bg-rose-50/50 dark:bg-rose-900/5', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-100 dark:border-rose-900/30', badgeBg: 'bg-rose-100 dark:bg-rose-500/10' },
    'ssl': { icon: ShieldCheck, gradient: 'from-indigo-500 to-blue-500', lightBg: 'bg-indigo-50/50 dark:bg-indigo-900/5', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-100 dark:border-indigo-900/30', badgeBg: 'bg-indigo-100 dark:bg-indigo-500/10' },
    'ipInfo': { icon: MapIcon, gradient: 'from-sky-500 to-blue-500', lightBg: 'bg-sky-50/50 dark:bg-sky-900/5', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-100 dark:border-sky-900/30', badgeBg: 'bg-sky-100 dark:bg-sky-500/10' },
    'smtp': { icon: Mail, gradient: 'from-amber-400 to-orange-500', lightBg: 'bg-amber-50/50 dark:bg-amber-900/5', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-900/30', badgeBg: 'bg-amber-100 dark:bg-amber-500/10' }
};

export function ToolSeoBlock({ toolId }: ToolSeoBlockProps) {
    const t = useTranslations('ToolSeoContent');

    const toolMapping: Record<string, string> = {
        'ping': 'ping',
        'http': 'http',
        'dns': 'dns',
        'mtr': 'mtr',
        'tcp': 'tcpUdp',
        'udp': 'tcpUdp',
        'dns-all': 'dns',
        'ssl': 'ssl',
        'info': 'ipInfo',
        'ip-info': 'ipInfo',
        'smtp': 'smtp'
    };

    const mappedId = toolMapping[toolId] || toolId;
    const knownTools = ['ping', 'http', 'dns', 'mtr', 'tcpUdp', 'ssl', 'ipInfo', 'smtp'];

    if (!knownTools.includes(mappedId)) return null;

    const style = toolStyles[mappedId];
    const MainIcon = style.icon;

    return (
        <section className="mt-8 mb-12 max-w-5xl mx-auto w-full">
            {/* ── Section Divider Strip ── */}
            <div className="relative flex items-center gap-4 mb-8">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-slate-200 dark:to-white/[0.06]" />
                <div className={`flex items-center gap-2.5 px-4 py-2 rounded-full border ${style.border} ${style.lightBg} shadow-sm`}>
                    <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${style.gradient} flex items-center justify-center flex-shrink-0`}>
                        <MainIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <h1 className={`text-sm font-bold tracking-wide ${style.text}`}>
                        {t(`${mappedId}.title`)}
                    </h1>
                </div>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-slate-200 dark:to-white/[0.06]" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Column: Understanding & Global */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Understanding Card */}
                    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                            <div className={`shrink-0 w-12 h-12 rounded-2xl ${style.badgeBg} ${style.text} flex items-center justify-center`}>
                                <Lightbulb className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                                    {t(`${mappedId}.understanding`)}
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {t(`${mappedId}.understandingDesc`)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Global Testing Card */}
                    <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50 border border-slate-200 dark:border-white/5 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className={`shrink-0 w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center`}>
                                <Earth className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                                    {t(`${mappedId}.global`)}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                                    {t(`${mappedId}.globalDesc`)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Metrics / Latency List */}
                <div className="lg:col-span-5">
                    <div className={`h-full p-6 sm:p-8 rounded-3xl ${style.lightBg} border ${style.border}`}>
                        <div className="flex items-center gap-3 mb-6">
                            <Gauge className={`w-6 h-6 ${style.text}`} />
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                {t(`${mappedId}.latency`)}
                            </h3>
                        </div>

                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm mb-6">
                            {t(`${mappedId}.latencyDesc`)}
                        </p>

                        <div className="space-y-4">
                            {Object.entries(t.has(`${mappedId}.latencyList`) ? t.raw(`${mappedId}.latencyList`) as Record<string, string> : {}).map(([key, value]) => {
                                const colonIndex = String(value).indexOf(':');
                                let boldPart = String(value);
                                let restPart = '';

                                if (colonIndex > -1) {
                                    boldPart = String(value).substring(0, colonIndex + 1);
                                    restPart = String(value).substring(colonIndex + 1);
                                }

                                return (
                                    <div key={key} className="flex gap-3 p-3 rounded-2xl bg-white/60 dark:bg-black/20 border border-slate-200/50 dark:border-white/5">
                                        <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${style.text}`} />
                                        <div>
                                            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm block mb-0.5">
                                                {boldPart}
                                            </span>
                                            {restPart && (
                                                <span className="text-slate-500 dark:text-slate-400 text-xs">
                                                    {restPart}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Info tip */}
                        <div className="mt-6 flex gap-2 items-start bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-900/20">
                            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-blue-700 dark:text-blue-400 leading-relaxed">
                                Results may vary depending on network conditions, routing paths, and server configuration.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
