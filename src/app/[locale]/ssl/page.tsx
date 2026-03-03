import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { ChecksClient } from '@/components/checks/ChecksClient';
import { JsonLd } from '@/components/SEO/JsonLd';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Metadata' });
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://checknode.io';

    return {
        title: t('sslTitle'),
        description: t('sslDesc'),
        keywords: [
            'ssl checker', 'tls certificate check', 'ssl certificate validator',
            'ssl expiry check', 'https checker', 'certificate chain check',
            'ssl test online', 'check ssl certificate', 'ssl monitoring',
            'tls version check', 'certificate authority check', 'wildcard ssl check'
        ],
        alternates: {
            canonical: `${siteUrl}/ssl`,
        },
        openGraph: {
            title: t('sslTitle'),
            description: t('sslDesc'),
            url: `${siteUrl}/ssl`,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: t('sslTitle'),
            description: t('sslDesc'),
        },
    };
}

const sslToolSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "SSL/TLS Certificate Checker",
    "description": "Verify SSL/TLS certificate validity, expiry date, chain of trust, cipher strength, and CA from 20+ global locations.",
    "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://checknode.io'}/ssl`,
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "All",
    "featureList": [
        "SSL Certificate Validity Check",
        "Certificate Expiry Date Monitoring",
        "Chain of Trust Verification",
        "Cipher Suite Analysis",
        "Certificate Authority (CA) Identification",
        "Multi-Location SSL Check",
        "TLS Version Detection",
        "Wildcard Certificate Support",
        "SAN (Subject Alternative Names) Display"
    ],
    "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
    }
};

export default async function SslPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <div className="flex flex-col min-h-full">
            <JsonLd data={sslToolSchema} />
            <ChecksClient initialTab="ssl" />
        </div>
    );
}
