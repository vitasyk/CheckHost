'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import ReactCountryFlag from 'react-country-flag';
import { useTransition, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const locales = [
    { code: 'en', label: 'English', country: 'US' },
    { code: 'uk', label: 'Українська', country: 'UA' },
    { code: 'es', label: 'Español', country: 'ES' },
    { code: 'de', label: 'Deutsch', country: 'DE' },
    { code: 'fr', label: 'Français', country: 'FR' },
    { code: 'pl', label: 'Polski', country: 'PL' },
    { code: 'it', label: 'Italiano', country: 'IT' },
    { code: 'nl', label: 'Nederlands', country: 'NL' },
    { code: 'ru', label: 'Русский', country: 'RU' },
];

export function LanguageSwitcher() {
    const currentLocale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [mounted, setMounted] = useState(false);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLanguageChange = (newLocale: string) => {
        // Preserve `host` param but intentionally drop `tab` (user goes back to home)
        const host = searchParams.get('host');
        const newSearch = host ? `?host=${encodeURIComponent(host)}` : '';
        startTransition(() => {
            router.replace(`${pathname}${newSearch}` as any, { locale: newLocale });
        });
    };

    const current = locales.find((l) => l.code === currentLocale) || locales[0];

    // Prevent hydration mismatch by rendering a placeholder with exact same dimensions
    if (!mounted) {
        return (
            <Button variant="ghost" size="sm" className="h-10 px-2 sm:px-3 gap-2 opacity-0 cursor-default">
                <div style={{ width: '1.2em', height: '1.2em' }} />
                <span className="hidden sm:inline-block text-xs font-bold uppercase tracking-widest text-transparent">
                    {current.code}
                </span>
            </Button>
        );
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-10 px-2 sm:px-3 gap-2" disabled={isPending}>
                    <ReactCountryFlag
                        countryCode={current.country}
                        svg
                        style={{ width: '1.2em', height: '1.2em' }}
                        title={current.label}
                        aria-label={current.label}
                    />
                    <span className="hidden sm:inline-block text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400">
                        {current.code}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[180px] p-2">
                <div className="flex flex-col gap-1">
                    {locales.map((locale) => (
                        <button
                            key={locale.code}
                            onClick={() => handleLanguageChange(locale.code)}
                            className={`flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${currentLocale === locale.code
                                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                }`}
                        >
                            <ReactCountryFlag
                                countryCode={locale.country}
                                svg
                                style={{ width: '1.2em', height: '1.2em' }}
                                title={locale.label}
                                aria-label={locale.label}
                            />
                            <span>{locale.label}</span>
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
