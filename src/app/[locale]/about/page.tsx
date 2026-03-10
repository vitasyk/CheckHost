import { Link } from '@/i18n/navigation';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { generateAlternates } from '@/lib/seo-utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Shield, Globe2, Server, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AdSlot } from '@/components/AdSlot';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Index' });
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://checkhost.com';

    return {
        title: `About Global Network Diagnostic Tools`,
        description: t('subtitle'),
        alternates: generateAlternates('about', siteUrl, locale),
    };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'About' });
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'CheckNode';

    return (
        <div className="relative">

            {/* Hero Section */}
            <section className="relative max-w-[1440px] mx-auto px-4 sm:px-8 pt-24 pb-16 md:pt-32 md:pb-24 text-center overflow-hidden">
                {/* Background ambient glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 mb-8">
                    <img src="/logo.png" alt={`${siteName} Logo`} width={20} height={20} className="h-5 w-5 rounded-md" />
                    <span className="text-sm font-medium bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">{t('badge')}</span>
                </div>

                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 tracking-tight text-slate-900 dark:text-white">
                    {t('heroTitle1').split(' ').map((word, i) => i === t('heroTitle1').split(' ').length - 1 ? <span key={i} className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">{word}</span> : word + ' ')}
                    <br />
                    {t('heroTitle2').split(' ').map((word, i) => i === t('heroTitle2').split(' ').length - 1 ? (
                        <span key={i} className="relative">{word}
                            <div className="absolute -bottom-2 left-0 w-full h-2 bg-gradient-to-r from-blue-600/40 to-indigo-600/40 rounded-full" />
                        </span>
                    ) : word + ' ')}
                </h1>

                <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
                    {t('heroSubtitle')}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link href="/">
                        <Button size="lg" className="h-14 px-8 text-base bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl shadow-lg hover:shadow-xl transition-all font-medium">
                            {t('exploreTools')}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Mission Section */}
            <section className="max-w-[1440px] mx-auto px-4 sm:px-8 py-20 border-y border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/20">
                <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">{t('missionTitle')}</h2>
                        <div className="space-y-6 text-lg text-slate-600 dark:text-slate-400">
                            <p>{t('missionP1')}</p>
                            <p dangerouslySetInnerHTML={{ __html: t.raw('missionP2').replace('{siteName}', `<strong>${siteName}</strong>`) }} />
                            <ul className="space-y-3 pt-4">
                                {(t.raw('missionItems') as string[]).map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                                        <CheckCircle2 className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/10 to-blue-500/10 rounded-[2rem] blur-2xl -z-10" />
                        <Card className="border-0 shadow-2xl bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl overflow-hidden rounded-2xl">
                            <div className="h-10 border-b border-slate-200 dark:border-white/10 flex items-center px-4 gap-2 bg-slate-50 dark:bg-slate-900">
                                <div className="h-3 w-3 rounded-full bg-red-400" />
                                <div className="h-3 w-3 rounded-full bg-amber-400" />
                                <div className="h-3 w-3 rounded-full bg-green-400" />
                            </div>
                            <div className="p-6 font-mono text-sm sm:text-base text-slate-700 dark:text-slate-300">
                                <div className="flex gap-4 opacity-70"><span className="text-blue-500">~</span> <span>ping node.checknode.io</span></div>
                                <div className="mt-2">PING node.checknode.io (104.21.XX.XX) 56(84) bytes of data.</div>
                                <div>64 bytes from 104.21.XX.XX: icmp_seq=1 ttl=59 time=14.2 ms</div>
                                <div>64 bytes from 104.21.XX.XX: icmp_seq=2 ttl=59 time=14.1 ms</div>
                                <div>64 bytes from 104.21.XX.XX: icmp_seq=3 ttl=59 time=14.4 ms</div>
                                <div className="mt-4 text-green-600 dark:text-green-400 font-semibold">--- node.checknode.io ping statistics ---</div>
                                <div className="text-green-600 dark:text-green-400">3 packets transmitted, 3 received, 0% packet loss</div>
                            </div>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Global Network Infrastructure */}
            <section className="max-w-[1440px] mx-auto px-4 sm:px-8 py-24">
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white">{t('infraTitle')}</h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                        {t('infraSubtitle')}
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
                    <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
                        <CardHeader className="text-center pb-4">
                            <div className="mx-auto h-12 w-12 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                                <Globe2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <CardTitle className="text-4xl font-black text-slate-900 dark:text-white">20+</CardTitle>
                            <CardDescription className="text-base font-medium mt-2">{t('activeRegions')}</CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
                        <CardHeader className="text-center pb-4">
                            <div className="mx-auto h-12 w-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4">
                                <Server className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <CardTitle className="text-4xl font-black text-slate-900 dark:text-white">&lt;2s</CardTitle>
                            <CardDescription className="text-base font-medium mt-2">{t('latency')}</CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
                        <CardHeader className="text-center pb-4">
                            <div className="mx-auto h-12 w-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
                                <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <CardTitle className="text-4xl font-black text-slate-900 dark:text-white">99.9%</CardTitle>
                            <CardDescription className="text-base font-medium mt-2">{t('uptime')}</CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </section>

            {/* Core Principles */}
            <section className="max-w-[1440px] mx-auto px-4 sm:px-8 py-24 bg-slate-50 dark:bg-slate-900/30 border-y border-slate-200 dark:border-white/5">
                <div className="w-full max-w-6xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 text-slate-900 dark:text-white">
                        {t('principlesTitle')}
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        <Card className="relative overflow-hidden border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-lg group hover:-translate-y-1 transition-transform duration-300">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
                            <CardHeader>
                                <div className="h-12 w-12 bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-md mb-4 group-hover:shadow-blue-500/25 transition-shadow">
                                    <Zap className="h-6 w-6" />
                                </div>
                                <CardTitle className="text-2xl mb-2">{t('principle1Title')}</CardTitle>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {t('principle1Desc')}
                                </p>
                            </CardHeader>
                        </Card>

                        <Card className="relative overflow-hidden border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-lg group hover:-translate-y-1 transition-transform duration-300">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
                            <CardHeader>
                                <div className="h-12 w-12 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-md mb-4 group-hover:shadow-indigo-500/25 transition-shadow">
                                    <Shield className="h-6 w-6" />
                                </div>
                                <CardTitle className="text-2xl mb-2">{t('principle2Title')}</CardTitle>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {t('principle2Desc')}
                                </p>
                            </CardHeader>
                        </Card>

                        <Card className="relative overflow-hidden border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-lg group hover:-translate-y-1 transition-transform duration-300">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
                            <CardHeader>
                                <div className="h-12 w-12 bg-purple-500 text-white rounded-xl flex items-center justify-center shadow-md mb-4 group-hover:shadow-purple-500/25 transition-shadow">
                                    <Globe2 className="h-6 w-6" />
                                </div>
                                <CardTitle className="text-2xl mb-2">{t('principle3Title')}</CardTitle>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {t('principle3Desc')}
                                </p>
                            </CardHeader>
                        </Card>
                    </div>
                </div>
            </section>

            <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-16">
                <AdSlot slotType="homepage_bottom" />
            </div>

            {/* Final CTA */}
            <section className="max-w-4xl mx-auto px-4 sm:px-8 py-20 text-center">
                <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">{t('ctaTitle')}</h2>
                <Link href="/">
                    <Button size="lg" className="h-14 px-8 text-base bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/25">
                        {t('ctaButton')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </section>
        </div>
    );
}
