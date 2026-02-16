import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { checkHostAPI } from '@/lib/checkhost-api';
import type { CheckType, ResultsResponse, Node } from '@/types/checkhost';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Play } from 'lucide-react';

interface CheckFormProps {
    type: CheckType;
    host: string;
    maxNodes: number;
    onMaxNodesChange: (value: number) => void;
    onHostChange: (value: string) => void;
    onResults: (results: ResultsResponse, checkNodes: Record<string, any>) => void;
    onCheckStart: (nodes: Record<string, any>) => void;
    onCheckComplete: (type: CheckType) => void;
    errorMessage: string | null;
    isLoading: boolean;
    nodes?: Record<string, Node>;
    onProgress?: (results: ResultsResponse) => void;
    dnsType?: string;
    onDnsTypeChange?: (value: string) => void;
}

export function CheckForm({
    type,
    onResults,
    onCheckStart,
    onProgress,
    onCheckComplete,
    nodes = {},
    host,
    onHostChange,
    errorMessage,
    isLoading,
    maxNodes,
    onMaxNodesChange,
    dnsType,
    onDnsTypeChange
}: CheckFormProps) {
    // Smart parsing logic
    const sanitizeInput = useCallback((input: string) => {
        let sanitized = input.trim();

        if (type === 'info' || type === 'ping' || type === 'dns' || type === 'dns-all' || type === 'tcp' || type === 'udp') {
            // Remove protocol
            sanitized = sanitized.replace(/^https?:\/\//, '');
            // Remove path/query
            sanitized = sanitized.split('/')[0];
        }

        return sanitized;
    }, [type]);

    const checkMutation = useMutation({
        mutationFn: async () => {
            const checkOptions: any = { maxNodes: type === 'dns-all' ? 1 : maxNodes };
            if (type === 'dns' && dnsType && dnsType !== 'all') {
                checkOptions.dnsType = dnsType;
            }

            // For dns-all, use the direct DNS lookup API
            if (type === 'dns-all') {
                const dnsData = await checkHostAPI.performDnsLookup(host);
                // Wrap in the expected format for ResultsDisplay
                const fakeNodeId = 'dns-lookup';
                const results: any = { [fakeNodeId]: dnsData };
                const checkNodes: any = { [fakeNodeId]: ['', '', 'Server DNS'] };
                if (onCheckStart) {
                    onCheckStart(checkNodes);
                }
                if (onProgress) {
                    onProgress(results);
                }
                return { results, checkNodes };
            }

            return checkHostAPI.performCheck(
                type,
                host,
                checkOptions,
                (results) => {
                    if (onProgress) {
                        onProgress(results);
                    }
                },
                (initResponse) => {
                    if (onCheckStart) {
                        onCheckStart(initResponse.nodes);
                    }
                }
            );
        },
        onSuccess: ({ results, checkNodes }) => {
            if (onResults) {
                onResults(results, checkNodes);
            }
        },
        onSettled: () => {
            if (onCheckComplete) {
                onCheckComplete(type);
            }
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!host.trim() || isLoading) return;

        const cleanHost = sanitizeInput(host);
        if (cleanHost !== host) {
            onHostChange(cleanHost);
        }

        if (cleanHost) {
            // For 'info' type, don't use CheckHost API - parent handles it
            if (type === 'info') {
                // Just trigger completion, parent component will handle the actual check
                onCheckComplete(type);
                return;
            }

            checkMutation.mutate();
        }
    };

    const getPlaceholder = () => {
        switch (type) {
            case 'info':
                return 'example.com or 1.1.1.1';
            case 'ping':
                return 'example.com or 1.1.1.1';
            case 'http':
                return 'https://example.com';
            case 'tcp':
                return 'example.com:443 or 1.1.1.1:80';
            case 'udp':
                return '8.8.8.8:53 or example.com:53';
            case 'dns':
            case 'dns-all':
                return 'example.com';
            default:
                return 'Enter URL or IP Address';
        }
    };

    return (
        <Card className="w-full border-slate-200/60 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden border transition-all duration-300">
            <CardContent className="p-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        {type === 'dns-all' && (
                            <div className="mb-4">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Record Type</Label>
                                <Select value={dnsType || 'all'} onValueChange={onDnsTypeChange}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Record Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All (Standard)</SelectItem>
                                        <SelectItem value="A">A (IPv4)</SelectItem>
                                        <SelectItem value="AAAA">AAAA (IPv6)</SelectItem>
                                        <SelectItem value="CNAME">CNAME</SelectItem>
                                        <SelectItem value="MX">MX (Mail)</SelectItem>
                                        <SelectItem value="NS">NS (Nameserver)</SelectItem>
                                        <SelectItem value="TXT">TXT</SelectItem>
                                        <SelectItem value="SOA">SOA</SelectItem>
                                        <SelectItem value="ptr">PTR</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="relative group">
                            <Input
                                id="host"
                                type="text"
                                value={host}
                                onChange={(e) => onHostChange(e.target.value)}
                                onBlur={() => onHostChange(sanitizeInput(host))}
                                placeholder={getPlaceholder()}
                                className={`text-lg h-14 pl-6 pr-32 rounded-xl border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-950/60 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all duration-300 ${errorMessage ? 'border-destructive ring-destructive' : ''}`}
                                autoFocus
                                required
                            />

                            <div className="absolute right-2 top-2 bottom-2 flex items-center gap-1.5">
                                {type !== 'dns-all' && (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-10 px-3 gap-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all duration-200"
                                            >
                                                <span className="font-bold text-xs">{maxNodes}</span>
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 p-4 rounded-xl border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-xl" align="end">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Nodes to use</h4>
                                                    <span className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">{maxNodes}</span>
                                                </div>
                                                <Slider
                                                    value={[maxNodes]}
                                                    onValueChange={(vals) => onMaxNodesChange(vals[0])}
                                                    min={3}
                                                    max={60}
                                                    step={1}
                                                    className="py-2"
                                                />
                                                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                                                    <span>3 NODES</span>
                                                    <span>60 NODES</span>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                )}

                                <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1" />

                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={checkMutation.isPending || isLoading || !host.trim()}
                                    className="h-10 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all duration-200 active:scale-95"
                                >
                                    {checkMutation.isPending || isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <span className="font-bold text-xs">CHECK</span>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {errorMessage && (
                            <p className="text-sm text-destructive font-medium animate-pulse pl-2">
                                {errorMessage}
                            </p>
                        )}
                    </div>

                    {checkMutation.isError && (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                            Error: {checkMutation.error?.message || 'Failed to perform check'}
                        </div>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}
