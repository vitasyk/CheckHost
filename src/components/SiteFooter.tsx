'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Globe, Wifi, Activity, Database, Info, Shield, FileText, Phone, BookOpen, ArrowLeftRight, Cloud, Route, Search, Lock, HelpCircle } from 'lucide-react';

export function SiteFooter() {
    const t = useTranslations('Footer');
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'CheckNode';
    const year = new Date().getFullYear();

    return (
        <footer className="w-full relative overflow-hidden border-t border-slate-200/60 dark:border-white/[0.05] bg-white/50 dark:bg-slate-950/50 backdrop-blur-md mt-auto">
            {/* Ambient Background Glows */}
            <div className="absolute -top-24 left-1/4 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-x-12 gap-y-10 lg:gap-x-16">
                    {/* Column 1 - Brand - Takes 4 cols */}
                    <div className="md:col-span-4 space-y-5">
                        <Link href="/" className="flex items-center gap-2.5 group">
                            <img src="/logo.svg" alt="" aria-hidden="true" className="h-8 w-8 group-hover:rotate-[10deg] transition-transform duration-500" />
                            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase italic">
                                {siteName}
                            </span>
                        </Link>
                        <p className="text-[14px] leading-relaxed text-slate-500 dark:text-slate-400/80 max-w-[280px]">
                            {t('slogan')}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                            <Globe className="h-3 w-3 text-indigo-500/70" />
                            <span>{t('globalCoverage')}</span>
                        </div>
                    </div>

                    {/* Navigation Columns Links - Takes 8 cols */}
                    <div className="md:col-span-8 grid grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-x-12">
                        {/* Tools */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400/80 dark:text-white/20">
                                {t('tools')}
                            </h3>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
                                {[
                                    { href: "/?tab=info", icon: Info, label: t('ipinfo') },
                                    { href: "/?tab=mtr", icon: Route, label: t('mtr') },
                                    { href: "/?tab=dns-all", icon: Search, label: t('dnsinfo') },
                                    { href: "/?tab=ssl", icon: Lock, label: t('ssl') },
                                ].map((tool) => (
                                    <li key={tool.label}>
                                        <Link
                                            href={tool.href}
                                            className="group flex items-center gap-2 text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-all duration-300"
                                        >
                                            <tool.icon className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300" />
                                            <span className="group-hover:translate-x-0.5 transition-transform duration-300">{tool.label}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Legal */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400/80 dark:text-white/20">
                                {t('legal')}
                            </h3>
                            <ul className="space-y-2.5">
                                {[
                                    { href: "/privacy", icon: Shield, label: t('privacy') },
                                    { href: "/terms", icon: FileText, label: t('terms') },
                                ].map((item) => (
                                    <li key={item.label}>
                                        <Link
                                            href={item.href}
                                            className="group flex items-center gap-2 text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-all duration-300"
                                        >
                                            <item.icon className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300" />
                                            <span className="group-hover:translate-x-0.5 transition-transform duration-300">{item.label}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Company */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400/80 dark:text-white/20">
                                {t('company')}
                            </h3>
                            <ul className="space-y-2.5">
                                {[
                                    { href: "/about", icon: Globe, label: t('about') },
                                    { href: "/faq", icon: HelpCircle, label: "FAQ" },
                                    { href: "/docs", icon: BookOpen, label: t('docs') },
                                    { href: "/contact", icon: Phone, label: t('contact') },
                                    { href: "/blog", icon: BookOpen, label: t('blog') },
                                ].map((item) => (
                                    <li key={item.label}>
                                        <Link
                                            href={item.href}
                                            className="group flex items-center gap-2 text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-all duration-300"
                                        >
                                            <item.icon className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300" />
                                            <span className="group-hover:translate-x-0.5 transition-transform duration-300">{item.label}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-10 pt-6 border-t border-slate-100 dark:border-white/[0.03] flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col items-center sm:items-start gap-0.5">
                        <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em]">
                            © {year} {siteName}
                        </p>
                        <p className="text-[9px] text-slate-400/50 font-medium">
                            {t('allRightsReserved')}
                        </p>
                    </div>

                    <div className="flex items-center gap-5">
                        {[
                            { href: "/privacy", label: t('privacy') },
                            { href: "/terms", label: t('terms') },
                            { href: "/contact", label: t('contact') },
                        ].map((link, idx) => (
                            <React.Fragment key={link.label}>
                                <Link
                                    href={link.href}
                                    className="text-[10px] font-bold text-slate-400/80 hover:text-indigo-600 dark:hover:text-white uppercase tracking-widest transition-colors"
                                >
                                    {link.label}
                                </Link>
                                {idx < 2 && <span className="h-0.5 w-0.5 rounded-full bg-slate-200 dark:bg-white/5" />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
