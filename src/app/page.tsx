import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Activity, Wifi, Database, ArrowRight, Globe2, Zap, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdSlot } from '@/components/AdSlot';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800">
            <Header />

            {/* Hero Section */}
            <section className="container mx-auto px-4 py-20 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
                    <Globe2 className="h-4 w-4" />
                    <span>Trusted by 10,000+ websites worldwide</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
                    Monitor Your Website's
                    <br />
                    Global Performance
                </h1>

                <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
                    Test uptime, latency, and DNS resolution from <strong>20+ locations</strong> worldwide.
                    Fast, free, and reliable network monitoring.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/checks">
                        <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base gap-2">
                            Start Monitoring
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-base">
                        View Documentation
                    </Button>
                </div>

                <AdSlot slotType="homepage_hero" />
            </section>

            {/* Stats Section */}
            <section className="container mx-auto px-4 py-12">
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
            <section className="container mx-auto px-4 py-16">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
                    Comprehensive Network Tools
                </h2>
                <p className="text-center text-muted-foreground mb-12 text-lg">
                    Everything you need to monitor your infrastructure
                </p>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    <Link href="/checks?tab=ping" className="group">
                        <Card className="h-full hover:shadow-2xl transition-all hover:-translate-y-2 cursor-pointer border-2 hover:border-blue-500/50">
                            <CardHeader>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                        <Wifi className="h-6 w-6" />
                                    </div>
                                    <CardTitle className="text-2xl">Ping Check</CardTitle>
                                </div>
                                <CardDescription className="text-base leading-relaxed">
                                    Test ICMP connectivity and measure network latency to your servers from multiple geographical locations worldwide.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <span className="text-blue-600 dark:text-blue-400 font-semibold group-hover:underline inline-flex items-center gap-1">
                                    Try Ping Check <ArrowRight className="h-4 w-4" />
                                </span>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/checks?tab=http" className="group">
                        <Card className="h-full hover:shadow-2xl transition-all hover:-translate-y-2 cursor-pointer border-2 hover:border-purple-500/50">
                            <CardHeader>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                                        <Activity className="h-6 w-6" />
                                    </div>
                                    <CardTitle className="text-2xl">HTTP Check</CardTitle>
                                </div>
                                <CardDescription className="text-base leading-relaxed">
                                    Monitor website uptime and response times. Get HTTP status codes and detect outages before your users experience them.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <span className="text-purple-600 dark:text-purple-400 font-semibold group-hover:underline inline-flex items-center gap-1">
                                    Try HTTP Check <ArrowRight className="h-4 w-4" />
                                </span>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/checks?tab=dns" className="group">
                        <Card className="h-full hover:shadow-2xl transition-all hover:-translate-y-2 cursor-pointer border-2 hover:border-pink-500/50">
                            <CardHeader>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                                        <Database className="h-6 w-6" />
                                    </div>
                                    <CardTitle className="text-2xl">DNS Check</CardTitle>
                                </div>
                                <CardDescription className="text-base leading-relaxed">
                                    Verify DNS resolution and check propagation across different global nameservers. Ensure your domain is resolving correctly.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <span className="text-pink-600 dark:text-pink-400 font-semibold group-hover:underline inline-flex items-center gap-1">
                                    Try DNS Check <ArrowRight className="h-4 w-4" />
                                </span>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="container mx-auto px-4 py-16">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                        Why Choose CheckHost?
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
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-orange-500 text-white mb-4">
                                <Globe2 className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Global Coverage</h3>
                            <p className="text-muted-foreground">
                                Test from 20+ locations across 6 continents
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="container mx-auto px-4 py-8 mt-16 text-center text-muted-foreground border-t">
                <p>© 2026 CheckHost.net - Website Monitoring Made Simple</p>
            </footer>
        </div>
    );
}
