import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { PwaProvider } from "@/components/providers/PwaProvider";
import { getSiteSetting } from "@/lib/site-settings";
import { GlobalNotice } from "@/components/GlobalNotice";
import { AdSlot } from "@/components/AdSlot";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Suspense } from "react";
import { Header } from "@/components/Header";
import { MainLayoutWrapper } from "@/components/MainLayoutWrapper";
import { GlobalAdEditorModal } from "@/components/admin/GlobalAdEditorModal";
import { JsonLd } from "@/components/SEO/JsonLd";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { PwaRegister } from "@/components/PwaRegister";
import { headers } from 'next/headers';
import { SiteFooter } from "@/components/SiteFooter";
import { CookieConsent } from "@/components/CookieConsent";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    setRequestLocale(locale);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://checknode.io';
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'checknode.io';
    const seo = await getSiteSetting('seo_config') || {};
    const siteTitle = seo.siteTitle || `${siteName} - Global Website Monitoring & Uptime Checker`;
    const siteDescription = seo.siteDescription || 'Check your website uptime, latency, and DNS from 20+ locations worldwide. Fast, free, and reliable infrastructure monitoring.';
    const keywords = typeof seo.keywords === 'string'
        ? seo.keywords.split(',').map((k: string) => k.trim())
        : ["uptime monitoring", "website checker", "ping test", "http check", "dns lookup", "ssl check", "mtr test"];

    return {
        title: {
            default: siteTitle,
            template: `%s | ${siteTitle.split('-')[0].trim()}`
        },
        description: siteDescription,
        keywords: keywords,
        authors: [{ name: `${siteName} Team` }],
        creator: siteName,
        metadataBase: new URL(siteUrl),
        alternates: {
            canonical: '/',
            languages: {
                'en-US': '/',
                'uk-UA': '/',
                'de-DE': '/',
                'es-ES': '/',
                'fr-FR': '/',
                'ru-RU': '/',
                'nl-NL': '/',
                'pl-PL': '/',
                'it-IT': '/',
            },
        },
        manifest: '/manifest.json',
        appleWebApp: {
            capable: true,
            statusBarStyle: 'default',
            title: siteName,
            startupImage: '/icons/apple-touch-icon.png',
        },
        icons: {
            icon: [
                { url: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
                { url: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
                { url: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
                { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
                { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
                { url: '/logo.svg', type: 'image/svg+xml' },
            ],
            apple: [
                { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
            ],
        },
        openGraph: {
            type: 'website',
            locale: locale === 'uk' ? 'uk_UA' : (locale === 'es' ? 'es_ES' : (locale === 'de' ? 'de_DE' : (locale === 'fr' ? 'fr_FR' : (locale === 'ru' ? 'ru_RU' : (locale === 'nl' ? 'nl_NL' : (locale === 'pl' ? 'pl_PL' : (locale === 'it' ? 'it_IT' : 'en_US'))))))),
            url: siteUrl,
            siteName: siteName,
            title: siteTitle,
            description: siteDescription,
            images: [
                {
                    url: '/og-image.png',
                    width: 1200,
                    height: 630,
                    alt: siteTitle,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: siteTitle,
            description: siteDescription,
            images: ['/og-image.png'],
        },
        robots: {
            index: true,
            follow: true,
        },
    };
}

export function generateViewport() {
    return {
        themeColor: [
            { media: '(prefers-color-scheme: light)', color: '#ffffff' },
            { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
        ],
    };
}

// Maintenance Page Content (outside for stability)
const MaintenancePage = () => (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Maintenance Mode</h1>
            <p className="text-slate-500 dark:text-slate-400">
                We are currently performing scheduled maintenance to improve our services.
                We&apos;ll be back online shortly. Thank you for your patience!
            </p>
            <div className="pt-4">
                <div className="text-xs uppercase font-bold text-slate-400 tracking-widest">Expected uptime</div>
                <div className="text-xl font-mono text-indigo-500 mt-2 italic shadow-sm inline-block px-3 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-white/5">
                    SOON
                </div>
            </div>
        </div>
    </div>
);

export default async function RootLayout({
    children,
    params,
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}>) {
    const { locale } = await params;

    // Ensure that the incoming `locale` is valid
    if (!routing.locales.includes(locale as any)) {
        notFound();
    }

    // Providing all messages to the client
    const messages = await getMessages();

    const session = await getServerSession(authOptions);
    const systemConfig = await getSiteSetting('system_config');
    const globalNotice = await getSiteSetting('global_notice');

    const isAdmin = !!session?.user;
    const isMaintenance = systemConfig?.maintenanceMode === true;

    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || headersList.get('x-invoke-path') || '';
    const isFullWidthPage = pathname.includes('/admin') || pathname.includes('/dashboard');

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://checknode.io';
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'checknode.io';

    const jsonLdData = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": siteName,
        "url": siteUrl,
        "potentialAction": {
            "@type": "SearchAction",
            "target": `${siteUrl}/?search={search_term_string}`,
            "query-input": "required name=search_term_string"
        }
    };

    const softwareApplicationData = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": `${siteName} Monitoring`,
        "operatingSystem": "All",
        "applicationCategory": "UtilitiesApplication",
        "url": siteUrl,
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        }
    };

    return (
        <html lang={locale} suppressHydrationWarning>
            <head>
                {/* Capture PWA install prompt BEFORE React boots to avoid race condition */}
                <script dangerouslySetInnerHTML={{
                    __html: `
                    window.__pwaPrompt = null;
                    window.addEventListener('beforeinstallprompt', function(e) {
                        e.preventDefault();
                        window.__pwaPrompt = e;
                        console.log('[PWA] beforeinstallprompt captured early');
                    });
                ` }} />
                <JsonLd data={jsonLdData} />
                <JsonLd data={softwareApplicationData} />
            </head>
            <body className={inter.className}>
                <NextIntlClientProvider messages={messages} locale={locale}>
                    <PwaProvider>
                        <Providers attribute="class" defaultTheme="system" enableSystem>
                            <PwaRegister />
                            {isMaintenance && !isAdmin ? (
                                <MaintenancePage />
                            ) : (
                                <>
                                    {globalNotice?.enabled && (
                                        <GlobalNotice
                                            message={globalNotice.message}
                                            type={globalNotice.type}
                                        />
                                    )}
                                    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
                                        <Header />

                                        <Suspense fallback={<div className="h-[90px]" />}>
                                            <AdSlot slotType="blog_top" className="w-full site-global-ad" />
                                        </Suspense>

                                        <MainLayoutWrapper
                                            leftAd={
                                                <Suspense fallback={<div className="h-[600px] w-full bg-slate-100/50 dark:bg-white/5 rounded-xl animate-pulse" />}>
                                                    <AdSlot slotType="sidebar_left" />
                                                </Suspense>
                                            }
                                            rightAd={
                                                <Suspense fallback={<div className="h-[600px] w-full bg-slate-100/50 dark:bg-white/5 rounded-xl animate-pulse" />}>
                                                    <AdSlot slotType="sidebar_right" />
                                                </Suspense>
                                            }
                                        >
                                            <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center animate-pulse text-slate-300">Loading content...</div>}>
                                                {children}
                                            </Suspense>
                                        </MainLayoutWrapper>

                                        <Suspense fallback={<div className="h-[250px]" />}>
                                            <AdSlot slotType="homepage_bottom" className="w-full site-global-ad" />
                                        </Suspense>

                                        <Suspense fallback={null}>
                                            <GlobalAdEditorModal />
                                        </Suspense>

                                        <SiteFooter />
                                        <CookieConsent />
                                    </div>
                                </>
                            )}
                        </Providers>
                    </PwaProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
