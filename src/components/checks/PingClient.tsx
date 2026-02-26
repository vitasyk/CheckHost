'use client';

import { useState } from 'react';
import type { ResultsResponse } from '@/types/checkhost';
import { CheckForm } from '@/components/checks/CheckForm';
import { ResultsDisplay } from '@/components/checks/ResultsDisplay';

export default function PingClient() {
    const [results, setResults] = useState<ResultsResponse | null>(null);
    const [host, setHost] = useState('');
    const [maxNodes, setMaxNodes] = useState(20);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleCheckStart = () => {
        setIsLoading(true);
        setResults(null);
        setErrorMessage(null);
    };

    const handleCheckComplete = () => {
        setIsLoading(false);
    };

    return (
        <div className="max-w-6xl mx-auto py-8">
            <div className="mb-6">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Ping Check
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                    Test ICMP connectivity from {results ? Object.keys(results).length : '10+'} global locations
                </p>
            </div>

            <CheckForm
                type="ping"
                host={host}
                onHostChange={setHost}
                maxNodes={maxNodes}
                onMaxNodesChange={setMaxNodes}
                onResults={setResults}
                onCheckStart={handleCheckStart}
                onCheckComplete={handleCheckComplete}
                errorMessage={errorMessage}
                isLoading={isLoading}
            />

            {results && <ResultsDisplay results={results} checkType="ping" />}
        </div>
    );
}
