import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateAlternates } from '@/lib/seo-utils';
import { ChecksClientNoSsr } from '@/components/checks/ChecksClientNoSsr';
import { JsonLd } from '@/components/SEO/JsonLd';
import { SmtpContent } from '@/components/content/SmtpContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Metadata' });
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://checknode.io';

    return {
        title: t('smtpTitle'),
        description: t('smtpDesc'),
        keywords: [
            'smtp test', 'smtp checker', 'mail server test', 'email server check',
            'port 25 test', 'smtp port checker', 'smtp connection test',
            'smtps port 465', 'submission port 587', 'check smtp server',
            'smtp banner check', 'ehlo test', 'spf check', 'dmarc check',
            'rbl blacklist check', 'email deliverability check'
        ],
        alternates: generateAlternates('smtp', siteUrl, locale),
        openGraph: {
            title: t('smtpTitle'),
            description: t('smtpDesc'),
            url: `${siteUrl}/smtp`,
            siteName: t('siteName'),
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: t('smtpTitle'),
            description: t('smtpDesc'),
        },
    };
}

const smtpToolSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "SMTP Mail Server Checker",
    "description": "Test SMTP mail server connectivity, verify port 25/465/587 availability, check SPF, DMARC, PTR records and RBL blacklists from 20+ global locations.",
    "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://checknode.io'}/smtp`,
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "All",
    "featureList": [
        "SMTP Connection Test (port 25, 465, 587)",
        "EHLO/HELO Handshake Verification",
        "SMTP Banner Detection",
        "SPF Record Validation",
        "DMARC Policy Check",
        "PTR Reverse DNS Verification",
        "RBL Blacklist Check (5 providers)",
        "MX Record Resolution",
        "STARTTLS Support Detection",
        "Global Availability Test"
    ],
    "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
    }
};

export default async function SmtpPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <div className="flex flex-col min-h-full">
            <JsonLd data={smtpToolSchema} />
            <ChecksClientNoSsr initialTab="smtp" />
            <SmtpContent />
        </div>
    );
}
