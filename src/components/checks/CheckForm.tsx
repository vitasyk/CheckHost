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
import { Switch } from '@/components/ui/switch';
import { Loader2, Play, ArrowLeftRight, Keyboard, User, MousePointerClick } from 'lucide-react';

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
    isReverseMtr?: boolean;
    onReverseMtrToggle?: (checked: boolean) => void;
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
    onDnsTypeChange,
    isReverseMtr = false,
    onReverseMtrToggle
}: CheckFormProps) {
    // Smart parsing logic
    const sanitizeInput = useCallback((input: string) => {
        let sanitized = input.trim();

        if (type === 'info' || type === 'ping' || type === 'dns' || type === 'dns-all' || type === 'tcp' || type === 'udp' || type === 'mtr' || type === 'ssl') {
            // Remove protocol
            sanitized = sanitized.replace(/^https?:\/\//, '');
            // Remove path/query
            sanitized = sanitized.split('/')[0];
        }

        return sanitized;
    }, [type]);

    const checkMutation = useMutation({
        onMutate: () => {
            if (onCheckStart) {
                onCheckStart({});
            }
        },
        mutationFn: async (targetHost: string) => {
            const checkOptions: any = { maxNodes: type === 'dns-all' ? 1 : maxNodes };
            if (type === 'dns' && dnsType && dnsType !== 'all') {
                checkOptions.dnsType = dnsType;
            }

            // For dns-all, use the direct DNS lookup API
            if (type === 'dns-all') {
                const dnsData = await checkHostAPI.performDnsLookup(targetHost);
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
                targetHost,
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
        if (cleanHost) {
            // For 'info' and 'ssl' type, don't use CheckHost API - parent handles it
            if (type === 'info' || type === 'ssl') {
                // Just trigger completion, parent component will handle the actual check
                onCheckComplete(type);
                return;
            }

            checkMutation.mutate(cleanHost);
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
            case 'ssl':
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
                        {type === 'mtr' && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-1 mb-4 gap-3">
                                <Label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <div className="bg-indigo-500/10 dark:bg-indigo-500/5 p-1 rounded-md border border-indigo-500/10">
                                        <ArrowLeftRight className={`h-3 w-3 ${isReverseMtr ? 'text-indigo-500 rotate-180' : 'text-slate-400'} transition-transform duration-500 ease-in-out`} />
                                    </div>
                                    Diagnostic Mode
                                </Label>

                                <div className="relative flex p-1 bg-slate-100/80 dark:bg-slate-900/80 rounded-xl border border-slate-200/60 dark:border-white/5 w-full sm:w-auto min-w-[300px] overflow-hidden">
                                    {/* Sliding active background */}
                                    <div
                                        className={`absolute inset-y-1 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) bg-white dark:bg-slate-800 shadow-sm rounded-lg border border-slate-200/50 dark:border-white/10 ${isReverseMtr ? 'left-[calc(50%+4px)] right-1' : 'left-1 right-[calc(50%+4px)]'}`}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => onReverseMtrToggle?.(false)}
                                        className={`relative flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all duration-300 z-10 whitespace-nowrap ${!isReverseMtr ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-500'}`}
                                    >
                                        <Keyboard className={`h-3.5 w-3.5 transition-all duration-300 ${!isReverseMtr ? 'scale-110' : 'scale-90 opacity-40 grayscale'}`} />
                                        <span>Manual Target</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => onReverseMtrToggle?.(true)}
                                        className={`relative flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all duration-300 z-10 whitespace-nowrap ${isReverseMtr ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-500'}`}
                                    >
                                        <User className={`h-3.5 w-3.5 transition-all duration-300 ${isReverseMtr ? 'scale-110' : 'scale-90 opacity-40 grayscale'}`} />
                                        <span>Using My IP</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="relative group">
                            <Input
                                id="host"
                                type="text"
                                value={host}
                                onChange={(e) => onHostChange(e.target.value)}
                                placeholder={getPlaceholder()}
                                className={`text-lg h-14 pl-6 pr-32 rounded-xl border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-950/60 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all duration-300 ${errorMessage && !errorMessage.includes('Using 1.1.1.1') ? 'border-destructive ring-destructive' : ''} ${isReverseMtr ? 'border-indigo-500/30' : ''}`}
                                autoFocus
                                required
                            />

                            <div className="absolute right-2 top-2 bottom-2 flex items-center gap-1.5">
                                {type !== 'dns-all' && type !== 'info' && type !== 'ssl' && (
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

                        {type === 'dns-all' && (
                            <div className="flex items-center gap-4 bg-slate-50/50 dark:bg-slate-950/20 p-2.5 px-4 rounded-xl border border-slate-200/50 dark:border-white/5 mt-2 transition-all">
                                <Label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest shrink-0">Records Filter:</Label>
                                <Select value={dnsType || 'all'} onValueChange={onDnsTypeChange}>
                                    <SelectTrigger className="h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-xs font-bold rounded-lg shadow-sm w-full md:w-[180px]">
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

                        {errorMessage && (
                            <p className={`text-[10px] font-bold uppercase tracking-wider pl-2 pt-1 ${errorMessage.includes('Using 1.1.1.1') ? 'text-indigo-500/70 animate-pulse' : 'text-destructive animate-bounce'}`}>
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
