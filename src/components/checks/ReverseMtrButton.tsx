'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight, Loader2, AlertCircle } from 'lucide-react';

export function ReverseMtrButton() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleReverseMtr = async () => {
        setLoading(true);
        setError(null);

        try {
            // Get user's IP
            const ipResponse = await fetch('/api/ip-info');
            const data = await ipResponse.json();

            if (!data.ip || data.ip === '0.0.0.0') {
                throw new Error('Could not detect your IP address');
            }

            // Validate IP is public
            if (isPrivateIp(data.ip) && !data.isFallback) {
                setError('Private IP detected. Reverse MTR only works with public IPs.');
                setLoading(false);
                return;
            }

            // If it's a fallback, we can show a small hint or just proceed
            if (data.isFallback) {
                // We'll show an info message below the button if it's a fallback
                setError('Local IP detected. Using 1.1.1.1 for demonstration.');
            }

            // Redirect to checks page with reverse MTR
            window.location.href = `/checks?tab=mtr&host=${data.ip}&reverse=true`;

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start Reverse MTR');
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-1">
            <Button
                onClick={handleReverseMtr}
                disabled={loading}
                variant="outline"
                className="group h-12 gap-3 px-6 bg-white dark:bg-slate-900 border-slate-200/60 dark:border-white/5 text-slate-900 dark:text-slate-100 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300 rounded-xl whitespace-nowrap"
                title="Run MTR from CheckHost servers to your IP"
            >
                {loading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                        <span className="font-bold">Detecting IP...</span>
                    </>
                ) : (
                    <>
                        <ArrowLeftRight className="h-4 w-4 text-indigo-600 dark:text-indigo-400 transition-transform group-hover:rotate-180 duration-500" />
                        <span className="font-bold">MTR to My IP</span>
                    </>
                )}
            </Button>
            {error && (
                <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                    <AlertCircle className="h-3 w-3" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}

// Helper to check if IP is private/local
function isPrivateIp(ip: string): boolean {
    const privateRanges = [
        /^10\./,
        /^192\.168\./,
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^127\./,
        /^169\.254\./, // Link-local
        /^::1$/, // IPv6 loopback
        /^fe80:/i, // IPv6 link-local
        /^fc00:/i, // IPv6 unique local
        /^fd00:/i, // IPv6 unique local
    ];

    return privateRanges.some(range => range.test(ip));
}
