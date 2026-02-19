'use client';

import { useState } from 'react';
import type { ResultsResponse } from '@/types/checkhost';
import { CheckForm } from '@/components/checks/CheckForm';
import { ResultsDisplay } from '@/components/checks/ResultsDisplay';
import Link from 'next/link';

export default function DnsPage() {
    const [results, setResults] = useState<ResultsResponse | null>(null);

    const [host, setHost] = useState('');
    const [maxNodes, setMaxNodes] = useState(20);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [dnsType, setDnsType] = useState<string>('A');

    const handleCheckStart = () => {
        setIsLoading(true);
        setResults(null);
        setErrorMessage(null);
    };

    const handleCheckComplete = () => {
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
            {/* Header */}
            <header className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            CheckHost.net
                        </Link>
                        <nav className="flex gap-6">
                            <Link href="/ping" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                Ping
                            </Link>
                            <Link href="/http" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                HTTP
                            </Link>
                            <Link href="/dns" className="text-blue-600 dark:text-blue-400 font-semibold">
                                DNS
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-[1fr,300px] gap-8 max-w-6xl mx-auto">
                    <div>
                        <div className="mb-6">
                            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                DNS Check
                            </h1>
                            <p className="text-gray-600 dark:text-gray-300">
                                Verify DNS resolution across different global nameservers
                            </p>
                        </div>

                        <CheckForm
                            type="dns"
                            host={host}
                            onHostChange={setHost}
                            maxNodes={maxNodes}
                            onMaxNodesChange={setMaxNodes}
                            onResults={setResults}
                            onCheckStart={handleCheckStart}
                            onCheckComplete={handleCheckComplete}
                            errorMessage={errorMessage}
                            isLoading={isLoading}
                            dnsType={dnsType}
                            onDnsTypeChange={setDnsType}
                        />

                        {results && (
                            <ResultsDisplay
                                results={results}
                                checkType="dns"
                                dnsType={dnsType}
                                onDnsTypeChange={setDnsType}
                            />
                        )}
                    </div>

                    {/* Sidebar - AdSense placeholder */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-24 space-y-4">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 text-center">
                                <p className="text-sm text-muted-foreground mb-2">Advertisement</p>
                                <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-gray-400">
                                    [AdSense 300x250]
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {/* Footer */}
            <footer className="container mx-auto px-4 py-8 mt-16 text-center text-gray-600 dark:text-gray-400 border-t">
                <p>© 2026 CheckHost.net - Website Monitoring Made Simple</p>
            </footer>
        </div>
    );
}
