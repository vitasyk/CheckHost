import { getTranslations } from 'next-intl/server';
import { generateAlternates } from '@/lib/seo-utils';
import { setRequestLocale } from 'next-intl/server';
import { ChecksClient } from '@/components/checks/ChecksClient';
import { ToolSeoBlock } from '@/components/content/ToolSeoBlock';

export async function generateMetadata({ params }: { params: Promise<{ locale: string, tool: string, host: string }> }) {
    const { locale, tool, host } = await params;
    const t = await getTranslations({ locale, namespace: 'Metadata' });
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://checknode.io';
    const decodedHost = decodeURIComponent(host);

    return {
        title: `${decodedHost} - ${tool.toUpperCase()} Check Report | CheckNode`,
        description: `Detailed ${tool.toUpperCase()} diagnostic report for ${decodedHost} from 20+ global locations.`,
        alternates: {
            canonical: `${siteUrl}/report/${tool}/${host}`,
        },
    };
}

export default async function ReportPage({ params }: { params: Promise<{ locale: string, tool: string, host: string }> }) {
    const { locale, tool, host } = await params;
    setRequestLocale(locale);

    const sanitizeHost = decodeURIComponent(host).trim().toLowerCase();

    return (
        <div className="flex flex-col min-h-full">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 mb-4 border-b border-slate-200 dark:border-white/5">
                <h1 className="text-3xl font-bold mb-2">Diagnostic Report</h1>
                <p className="text-slate-500">Live test results for <span className="font-semibold text-slate-800 dark:text-slate-200">{sanitizeHost}</span></p>
            </div>
            <ChecksClient initialTab={tool} initialHost={sanitizeHost} autoStart={true} />
            <div className="mt-8">
                <ToolSeoBlock toolId={tool} titleTag="h2" />
            </div>
        </div>
    );
}
