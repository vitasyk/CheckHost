'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Globe, Wifi, Activity, Database, Info, Shield, FileText, Phone, BookOpen } from 'lucide-react';

export function SiteFooter() {
    const t = useTranslations('Footer');
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'CheckNode';
    const year = new Date().getFullYear();

    return (
        <footer className="w-full border-t border-slate-200 dark:border-white/5 bg-white dark:bg-slate-950 mt-auto">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                    {/* Column 1 - Brand */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <img src="/logo.png" alt={siteName} className="h-7 w-7 rounded-md" />
                            <span className="text-lg font-bold text-slate-900 dark:text-white">{siteName}</span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            {t('slogan')}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Globe className="h-3 w-3" />
                            <span>{t('globalCoverage')}</span>
                        </div>
                    </div>

                    {/* Column 2 - Tools */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{t('tools')}</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/?tab=ping" className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                    <Wifi className="h-3.5 w-3.5" />
                                    {t('ping')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/?tab=http" className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                    <Activity className="h-3.5 w-3.5" />
                                    {t('http')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/?tab=dns" className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                    <Database className="h-3.5 w-3.5" />
                                    {t('dns')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/?tab=info" className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                    <Info className="h-3.5 w-3.5" />
                                    {t('ipinfo')}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3 - Legal */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{t('legal')}</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/privacy" className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                    <Shield className="h-3.5 w-3.5" />
                                    {t('privacy')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                    <FileText className="h-3.5 w-3.5" />
                                    {t('terms')}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 4 - Company */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{t('company')}</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/about" className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                    <Globe className="h-3.5 w-3.5" />
                                    {t('about')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                    <Phone className="h-3.5 w-3.5" />
                                    {t('contact')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/blog" className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                    <BookOpen className="h-3.5 w-3.5" />
                                    {t('blog')}
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-10 pt-6 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-slate-400">
                        © {year} {siteName}. {t('allRightsReserved')}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                        <Link href="/privacy" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">{t('privacy')}</Link>
                        <span>·</span>
                        <Link href="/terms" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">{t('terms')}</Link>
                        <span>·</span>
                        <Link href="/contact" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">{t('contact')}</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
