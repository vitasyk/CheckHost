'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="flex items-center gap-2">
                <div className="w-4 h-4" />
                <div className="w-8 h-4 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
                <div className="w-4 h-4" />
            </div>
        );
    }

    const isDark = resolvedTheme === 'dark';

    return (
        <div className="flex items-center gap-2">
            <Sun className={cn("h-4 w-4 transition-colors", !isDark ? "text-yellow-500" : "text-slate-400")} />
            <Switch
                checked={isDark}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                aria-label="Toggle theme"
            />
            <Moon className={cn("h-4 w-4 transition-colors", isDark ? "text-blue-500" : "text-slate-400")} />
        </div>
    );
}
