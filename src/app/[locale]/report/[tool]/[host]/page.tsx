import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { generateAlternates } from '@/lib/seo-utils';
import { ChecksClient } from '@/components/checks/ChecksClient';
import { ToolSeoBlock } from '@/components/content/ToolSeoBlock';
import { ToolFaqBlock } from '@/components/content/ToolFaqBlock';

export const checkNames: Record<string, string> = {
    'ping': 'Ping Check',
    'http': 'HTTP Website Check',
    'tcp': 'TCP Port Check',
    'udp': 'UDP Port Check',
    'dns': 'DNS Lookup',
    'dns-all': 'Full DNS Report',
    'info': 'IP & Geolocation Info',
    'ssl': 'SSL Certificate Check',
    'mtr': 'MTR / Traceroute',
    'smtp': 'SMTP Check'
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string, tool: string, host: string }> }) {
    const { tool, host, locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Metadata' });

    // Try to get translated tool name from Metadata namespace if possible, otherwise fallback
    const toolKey = tool.toLowerCase();
    const toolName = t.raw(`${toolKey}Title`)?.split(' - ')[0]?.split(' | ')[0] || checkNames[toolKey] || tool.toUpperCase();

    return {
        title: `${toolName} for ${host} | ${process.env.NEXT_PUBLIC_SITE_NAME || 'CheckNode'}`,
        description: `Perform ${toolName} diagnostic tests for ${host}. Analyze network latency, reachability, and DNS configuration globally.`,
        alternates: generateAlternates(`report/${tool}/${host}`, process.env.NEXT_PUBLIC_SITE_URL || 'https://checknode.io', locale),
    };
}

export default async function ReportPage({ params }: { params: Promise<{ locale: string, tool: string, host: string }> }) {
    const { locale, tool, host } = await params;
    setRequestLocale(locale);

    // Simple sanitization
    const sanitizeHost = decodeURIComponent(host).trim().toLowerCase();

    // Basic host validation to avoid Soft 404s for clearly invalid input
    // 1. Must not be empty
    // 2. Must contain at least one dot (for domains) OR be a valid IP (v4/v6)
    // IPv6 detection is simple: contains colon and hex chars
    const isIp = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(sanitizeHost) ||
        (sanitizeHost.includes(':') && /^[0-9a-f:]+$/.test(sanitizeHost));
    const isDomain = sanitizeHost.includes('.') && /^[a-z0-9.-]+$/.test(sanitizeHost);

    if (!sanitizeHost || (!isIp && !isDomain)) {
        notFound();
    }
    const t = await getTranslations({ locale, namespace: 'Metadata' });
    const toolKey = tool.toLowerCase();
    const toolName = t.raw(`${toolKey}Title`)?.split(' - ')[0]?.split(' | ')[0] || checkNames[toolKey] || tool.toUpperCase();

    return (
        <div className="flex flex-col min-h-full">
            <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-8 py-8 mb-4 border-b border-slate-200 dark:border-white/5">
                <h1 className="text-3xl font-bold mb-2">{toolName} Report for {sanitizeHost}</h1>
                <p className="text-slate-500">Live network diagnostic results from 20+ global locations</p>
            </div>
            <ChecksClient initialTab={tool} initialHost={sanitizeHost} autoStart={true} />

            <div className="mt-8 border-t border-slate-200 dark:border-white/5 pt-8">
                <ToolSeoBlock toolId={tool} />
                <ToolFaqBlock toolId={tool} locale={locale} />
            </div>
        </div>
    );
}
