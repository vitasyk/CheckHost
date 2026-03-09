'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Cookie, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CookieConsent() {
    const t = useTranslations('CookieConsent');
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
            // Small delay so it doesn't flash on first paint
            const timer = setTimeout(() => setVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const accept = () => {
        localStorage.setItem('cookie_consent', 'accepted');
        setVisible(false);
    };

    const decline = () => {
        localStorage.setItem('cookie_consent', 'essential');
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-shrink-0 p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                        <Cookie className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{t('title')}</p>
                        <div className="flex-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {t('description')}{' '}
                            <Link
                                href="/privacy"
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors font-medium border-b border-indigo-400/30 hover:border-indigo-300"
                            >
                                {t('privacyPolicy')}
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={decline}
                            className="flex-1 sm:flex-none text-slate-500 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            <X className="h-3.5 w-3.5 mr-1" />
                            {t('essential')}
                        </Button>
                        <Button
                            size="sm"
                            onClick={accept}
                            className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                        >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {t('acceptAll')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
