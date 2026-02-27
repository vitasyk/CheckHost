import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

interface ToolSeoBlockProps {
    toolId: string;
}

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
        'ip-info': 'ipInfo'
    };

    const mappedId = toolMapping[toolId] || toolId;

    // If no mapping found for an unknown tool, show nothing
    const knownTools = ['ping', 'http', 'dns', 'mtr', 'tcpUdp', 'ssl', 'ipInfo'];
    if (!knownTools.includes(mappedId)) return null;

    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        {t(`${mappedId}.title`)}
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                            {t(`${mappedId}.understanding`)}
                        </h2>
                        <p>{t(`${mappedId}.understandingDesc`)}</p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                            {t(`${mappedId}.latency`)}
                        </h2>
                        <p>{t(`${mappedId}.latencyDesc`)}</p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            {Object.entries(t.raw(`${mappedId}.latencyList`)).map(([key, value]) => {
                                // Format value safely: e.g., "Fast (0-50ms): Excellent" -> bold "Fast (0-50ms):"
                                const colonIndex = String(value).indexOf(':');
                                if (colonIndex > -1) {
                                    const boldPart = String(value).substring(0, colonIndex + 1);
                                    const restPart = String(value).substring(colonIndex + 1);
                                    return (
                                        <li key={key}>
                                            <strong>{boldPart}</strong>{restPart}
                                        </li>
                                    );
                                }
                                return <li key={key}>{String(value)}</li>;
                            })}
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                            {t(`${mappedId}.global`)}
                        </h2>
                        <p>{t(`${mappedId}.globalDesc`)}</p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
