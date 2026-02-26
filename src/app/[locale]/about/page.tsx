import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Activity, Wifi, Database, ArrowRight, Zap, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdSlot } from '@/components/AdSlot';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Index' });

    return {
        title: `About | ${process.env.NEXT_PUBLIC_SITE_NAME || 'CheckHost'}`,
        description: t('subtitle'),
        alternates: {
            canonical: '/about',
        },
    };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'Index' });
    const tTools = await getTranslations({ locale, namespace: 'Tools' });

    return (
        <div className="relative">

            {/* Hero Section */}
            <section className="max-w-[1440px] mx-auto px-4 sm:px-8 py-20 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6 border border-blue-200 dark:border-blue-800/50">
                    <img src="/logo.png" alt="CheckHost" className="h-5 w-5 rounded-md" />
                    <span>Trusted by 10,000+ websites worldwide</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
                    {t('title')}
                </h1>

                <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
                    {t('subtitle')}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/">
                        <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base gap-2">
                            {t('startMonitoring')}
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-base">
                        {t('viewDocs')}
                    </Button>
                </div>

                <AdSlot slotType="homepage_hero" />
            </section>

            {/* Stats Section */}
            <section className="max-w-[1440px] mx-auto px-4 sm:px-8 py-12">
                <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    <Card className="text-center border-2 hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="text-4xl font-bold text-blue-600 dark:text-blue-400">20+</CardTitle>
                            <CardDescription>Global Locations</CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="text-center border-2 hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="text-4xl font-bold text-purple-600 dark:text-purple-400">99.9%</CardTitle>
                            <CardDescription>API Reliability</CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="text-center border-2 hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="text-4xl font-bold text-pink-600 dark:text-pink-400">&lt;2s</CardTitle>
                            <CardDescription>Average Response</CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </section>

            {/* Features Grid */}
            <section className="max-w-[1440px] mx-auto px-4 sm:px-8 py-16">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
                    Comprehensive Network Tools
                </h2>
                <p className="text-center text-muted-foreground mb-12 text-lg">
                    Everything you need to monitor your infrastructure
                </p>

                <div className="grid md:grid-cols-3 gap-8 w-full">
                    <Link href="/?tab=ping" className="group">
                        <Card className="h-full hover:shadow-2xl transition-all hover:-translate-y-2 cursor-pointer border-2 hover:border-blue-500/50">
                            <CardHeader>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                        <Wifi className="h-6 w-6" />
                                    </div>
                                    <CardTitle className="text-2xl">{tTools('ping')}</CardTitle>
                                </div>
                                <CardDescription className="text-base leading-relaxed">
                                    Test ICMP connectivity and measure network latency to your servers from multiple geographical locations worldwide.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <span className="text-blue-600 dark:text-blue-400 font-semibold group-hover:underline inline-flex items-center gap-1">
                                    {tTools('ping')} <ArrowRight className="h-4 w-4" />
                                </span>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/?tab=http" className="group">
                        <Card className="h-full hover:shadow-2xl transition-all hover:-translate-y-2 cursor-pointer border-2 hover:border-purple-500/50">
                            <CardHeader>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                                        <Activity className="h-6 w-6" />
                                    </div>
                                    <CardTitle className="text-2xl">{tTools('http')}</CardTitle>
                                </div>
                                <CardDescription className="text-base leading-relaxed">
                                    Monitor website uptime and response times. Get HTTP status codes and detect outages before your users experience them.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <span className="text-purple-600 dark:text-purple-400 font-semibold group-hover:underline inline-flex items-center gap-1">
                                    {tTools('http')} <ArrowRight className="h-4 w-4" />
                                </span>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/?tab=dns" className="group">
                        <Card className="h-full hover:shadow-2xl transition-all hover:-translate-y-2 cursor-pointer border-2 hover:border-pink-500/50">
                            <CardHeader>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                                        <Database className="h-6 w-6" />
                                    </div>
                                    <CardTitle className="text-2xl">{tTools('dns')}</CardTitle>
                                </div>
                                <CardDescription className="text-base leading-relaxed">
                                    Verify DNS resolution and check propagation across different global nameservers. Ensure your domain is resolving correctly.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <span className="text-pink-600 dark:text-pink-400 font-semibold group-hover:underline inline-flex items-center gap-1">
                                    {tTools('dns')} <ArrowRight className="h-4 w-4" />
                                </span>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="max-w-[1440px] mx-auto px-4 sm:px-8 py-16">
                <div className="w-full">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                        Why Choose {process.env.NEXT_PUBLIC_SITE_NAME || 'CheckHost'}?
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white mb-4">
                                <Zap className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
                            <p className="text-muted-foreground">
                                Get results in seconds from our globally distributed network
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white mb-4">
                                <Shield className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Reliable & Secure</h3>
                            <p className="text-muted-foreground">
                                99.9% uptime with enterprise-grade infrastructure
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-white/10 mb-4 overflow-hidden">
                                <img src="/logo.png" alt="Global Coverage" className="h-full w-full object-cover" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Global Coverage</h3>
                            <p className="text-muted-foreground">
                                Test from 20+ locations across 6 continents
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
                <AdSlot slotType="homepage_bottom" />
            </div>

            {/* Footer */}
            <footer className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 mt-16 text-center text-muted-foreground border-t">
                <p>© 2026 {process.env.NEXT_PUBLIC_SITE_NAME || 'CheckHost'} - Website Monitoring Made Simple</p>
            </footer>
        </div>
    );
}
