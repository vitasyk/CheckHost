// import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { ChecksClient } from '@/components/checks/ChecksClient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string, tool: string, host: string }> }) {
    const { tool, host } = await params;
    // const t = await getTranslations({ locale });

    // Attempt to get the tool name natively, fallback to uppercase
    const checkNames: Record<string, string> = {
        'ping': 'Ping Check',
        'http': 'HTTP Website Check',
        'tcp': 'TCP Port Check',
        'udp': 'UDP Port Check',
        'dns': 'DNS Lookup',
        'dns-all': 'Full DNS Report',
        'info': 'IP & Geolocation Info',
        'ssl': 'SSL Certificate Check',
        'mtr': 'MTR / Traceroute'
    };

    const toolName = checkNames[tool.toLowerCase()] || tool.toUpperCase();

    return {
        title: `${toolName} for ${host} | ${process.env.NEXT_PUBLIC_SITE_NAME || 'CheckHost.top'}`,
        description: `Perform ${toolName} diagnostic tests for ${host}. Analyze network latency, reachability, and DNS configuration globally.`,
        alternates: {
            canonical: `/report/${tool}/${host}`,
        },
    };
}

export default async function ReportPage({ params }: { params: Promise<{ locale: string, tool: string, host: string }> }) {
    const { locale, tool, host } = await params;
    setRequestLocale(locale);

    // Simple sanitization
    const sanitizeHost = decodeURIComponent(host).trim().toLowerCase();

    return (
        <div className="flex flex-col min-h-full">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 mb-4 border-b border-slate-200 dark:border-white/5">
                <h1 className="text-3xl font-bold mb-2">Diagnostic Report</h1>
                <p className="text-slate-500">Live test results for <span className="font-semibold text-slate-800 dark:text-slate-200">{sanitizeHost}</span></p>
            </div>
            <ChecksClient initialTab={tool} initialHost={sanitizeHost} autoStart={true} />
        </div>
    );
}
