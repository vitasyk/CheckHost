'use client';

import { Smartphone } from 'lucide-react';
import { usePwa } from '@/components/providers/PwaProvider';
import { useTranslations } from 'next-intl';

interface InstallAppButtonProps {
    className?: string;
}

export function InstallAppButton({ className }: InstallAppButtonProps) {
    const { isInstallable, isStandalone, installApp } = usePwa();
    const t = useTranslations('Share');

    // Never show if already running as installed app
    if (isStandalone) return null;

    return (
        <button
            onClick={isInstallable ? installApp : undefined}
            disabled={!isInstallable}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95
                ${isInstallable
                    ? 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50 cursor-pointer'
                    : 'bg-white/50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-white/5 text-slate-400 dark:text-slate-500 cursor-default opacity-60'
                } ${className || ''}`}
            title={isInstallable ? t('installApp') : 'Available when visiting from a supported browser'}
        >
            <div className="relative">
                <Smartphone className={`h-4 w-4 ${isInstallable ? 'text-indigo-500' : 'text-slate-400'}`} />
                {isInstallable && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                )}
            </div>
            {t('installApp')}
        </button>
    );
}
