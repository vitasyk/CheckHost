'use client';

import { useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';
import { checkHostAPI } from '@/lib/checkhost-api';
import type { CheckType, ResultsResponse, Node } from '@/types/checkhost';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
    RefreshCw,
    Activity,
    Users,
    MapPin,
    Loader2,
    X,
    Settings2,
} from 'lucide-react';

const QUICK_LINKS: Record<CheckType, string[]> = {
    'info': ['1.1.1.1', '8.8.8.8', 'google.com', 'AS13335'],
    'ping': ['google.com', '1.1.1.1', 'cloudflare.com'],
    'http': ['https://google.com', 'https://cloudflare.com'],
    'tcp': ['google.com:443', '1.1.1.1:53'],
    'udp': ['8.8.8.8:53', '1.1.1.1:53'],
    'dns': ['google.com', 'cloudflare.com'],
    'mtr': ['google.com', '1.1.1.1'],
    'dns-all': ['google.com', 'github.com'],
    'ssl': ['google.com', 'cloudflare.com'],
    'smtp': ['gmail-smtp-in.l.google.com', 'outlook-com.olc.protection.outlook.com']
};

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
    selectedNodeIds?: string[];
    onProgress?: (results: ResultsResponse) => void;
    dnsType?: string;
    onDnsTypeChange?: (value: string) => void;
    isReverseMtr?: boolean;
    onReverseMtrToggle?: (checked: boolean) => void;
    selectedNodeCount?: number;
    onToggleMap?: () => void;
    onClearSelection?: () => void;
    isMapVisible?: boolean;
    autoStart?: boolean;
    showQuickLinks?: boolean;
    smtpPort?: number;
    onSmtpPortChange?: (port: number) => void;
}

export function CheckForm({
    type,
    onResults,
    onCheckStart,
    onProgress,
    onCheckComplete,
    nodes: _nodes = {},
    host,
    onHostChange,
    errorMessage,
    isLoading,
    maxNodes,
    onMaxNodesChange,
    dnsType,
    onDnsTypeChange: _onDnsTypeChange,
    isReverseMtr = false,
    onReverseMtrToggle,
    selectedNodeCount = 0,
    selectedNodeIds = [],
    onToggleMap,
    onClearSelection,
    isMapVisible = false,
    autoStart = false,
    showQuickLinks = false,
    smtpPort = 25,
    onSmtpPortChange
}: CheckFormProps) {
    // Smart parsing logic
    const sanitizeInput = useCallback((input: string) => {
        let sanitized = input.trim();

        // Detect ASN input format (e.g. "as 13335" or "AS13335")
        const asnMatch = sanitized.match(/^as\s*(\d+)$/i);
        if (asnMatch && type === 'info') {
            return `AS${asnMatch[1]}`;
        }

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
            const checkOptions: any = {
                maxNodes: type === 'dns-all' ? 1 : maxNodes,
                nodes: selectedNodeIds.length > 0 ? selectedNodeIds : undefined
            };
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
            // For 'info', 'ssl', 'smtp', and 'dns-all' type, don't use CheckHost API mutation - parent handles it
            if (type === 'info' || type === 'ssl' || type === 'smtp' || type === 'dns-all') {
                // Just trigger completion, parent component will handle the actual check
                onCheckComplete(type);
                return;
            }

            checkMutation.mutate(cleanHost);
        }
    };

    useEffect(() => {
        if (autoStart && host && !isLoading && !checkMutation.isPending) {
            const cleanHost = sanitizeInput(host);
            if (cleanHost) {
                if (type === 'info' || type === 'ssl' || type === 'smtp' || type === 'dns-all') {
                    onCheckComplete(type);
                } else {
                    checkMutation.mutate(cleanHost);
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoStart]);

    const getPlaceholder = () => {
        switch (type) {
            case 'info':
                return 'example.com, 1.1.1.1, or AS13335';
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
        <Card className="w-full bg-transparent border-none shadow-none overflow-visible">
            <CardContent className="p-0 sm:p-2">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        {type === 'mtr' && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-1 mb-4 gap-3">
                                <Label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <div className="bg-indigo-500/10 dark:bg-indigo-500/5 p-1 rounded-md border border-indigo-500/10">
                                        <RefreshCw className={`h-3 w-3 ${isReverseMtr ? 'text-indigo-500 rotate-180' : 'text-slate-400'} transition-transform duration-500 ease-in-out`} />
                                    </div>
                                    Diagnostic Mode
                                </Label>

                                <div className="relative flex p-1 bg-white/80 dark:bg-slate-900/80 shadow-sm rounded-xl border border-slate-200/80 dark:border-white/5 w-full sm:w-auto min-w-[300px] overflow-hidden">
                                    {/* Sliding active background */}
                                    <div
                                        className={`absolute inset-y-1 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) bg-indigo-50 dark:bg-slate-800 rounded-lg border border-indigo-100 dark:border-white/10 ${isReverseMtr ? 'left-[calc(50%+4px)] right-1' : 'left-1 right-[calc(50%+4px)]'}`}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => onReverseMtrToggle?.(false)}
                                        className={`relative flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all duration-300 z-10 whitespace-nowrap ${!isReverseMtr ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                    >
                                        <Activity className={`h-3.5 w-3.5 transition-all duration-300 ${!isReverseMtr ? 'scale-110' : 'scale-90 opacity-40 grayscale'}`} />
                                        <span>Manual Target</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => onReverseMtrToggle?.(true)}
                                        className={`relative flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all duration-300 z-10 whitespace-nowrap ${isReverseMtr ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                    >
                                        <RefreshCw className={`h-3.5 w-3.5 transition-all duration-300 ${isReverseMtr ? 'scale-110' : 'scale-90 opacity-40 grayscale'}`} />
                                        <span>Using My IP</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="relative group shadow-sm hover:shadow-md focus-within:shadow-md focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all duration-300 rounded-2xl">
                            <Input
                                id="host"
                                type="text"
                                value={host}
                                onChange={(e) => onHostChange(e.target.value)}
                                placeholder={getPlaceholder()}
                                className={`text-xl font-medium placeholder:text-slate-400/80 h-16 pl-6 pr-[280px] sm:pr-[310px] rounded-2xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-indigo-500/80 hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300 ${errorMessage && !errorMessage.includes('Using 1.1.1.1') ? 'border-destructive' : ''} ${isReverseMtr ? 'border-indigo-500/50' : ''}`}
                                autoFocus
                                required
                            />

                            <div className="absolute right-2 top-2 bottom-2 flex items-center gap-2">
                                {type !== 'dns-all' && type !== 'info' && type !== 'ssl' && type !== 'smtp' && (
                                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/50 dark:border-white/5 backdrop-blur-sm">
                                        {!isMapVisible ? (
                                            <>
                                                {/* Nodes Picker Capsule */}
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <button
                                                            type="button"
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 group/pill"
                                                        >
                                                            <Users className="h-4 w-4 text-slate-400 group-hover/pill:text-indigo-500 transition-colors" />
                                                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 tracking-tight">{maxNodes} Nodes</span>
                                                            <Settings2 className="h-3 w-3 text-slate-300 dark:text-slate-500" />
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-64 p-4 rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl" align="end" sideOffset={8}>
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Node Population</h4>
                                                                <span className="text-sm font-mono font-bold text-indigo-500">{maxNodes}</span>
                                                            </div>
                                                            <Slider
                                                                value={[maxNodes]}
                                                                onValueChange={(vals) => onMaxNodesChange(vals[0])}
                                                                min={3}
                                                                max={60}
                                                                step={1}
                                                            />
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>

                                                <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-0.5" />

                                                {/* Map Toggle Capsule */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (isMapVisible) onClearSelection?.();
                                                        onToggleMap?.();
                                                    }}
                                                    className={cn(
                                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 group/map",
                                                        selectedNodeCount > 0
                                                            ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                                            : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                                                    )}
                                                >
                                                    <MapPin className={cn(
                                                        "h-4 w-4 transition-all duration-1000",
                                                        selectedNodeCount > 0
                                                            ? "text-indigo-500"
                                                            : "text-slate-400 group-hover/map:text-indigo-500 animate-[pulse_5s_infinite] scale-105"
                                                    )} />
                                                    <span className="text-[11px] font-bold tracking-tight">
                                                        {selectedNodeCount > 0 ? `${selectedNodeCount} Regions` : 'Map'}
                                                    </span>
                                                </button>
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-2 pl-3 pr-1 py-1 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
                                                <div className="flex items-center gap-1.5">
                                                    <Activity className="h-4 w-4 text-indigo-500 animate-pulse" />
                                                    <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">
                                                        {selectedNodeCount > 0 ? `${selectedNodeCount} Nodes Selected` : 'Select on Map'}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        onClearSelection?.();
                                                        onToggleMap?.();
                                                    }}
                                                    className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-md text-indigo-600 dark:text-indigo-400 transition-colors"
                                                    title="Close Map (Back to Auto)"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}

                                        {/* Reset Selection Button (when nodes are active but map is closed) */}
                                        {!isMapVisible && selectedNodeCount > 0 && (
                                            <button
                                                type="button"
                                                onClick={onClearSelection}
                                                className="ml-1 p-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full text-rose-500 transition-colors"
                                                title="Reset Selection"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* SMTP Port Selector */}
                                {type === 'smtp' && (
                                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200/60 dark:border-white/10 backdrop-blur-sm mr-2 hidden sm:flex shadow-inner">
                                        {[25, 465, 587].map((port) => (
                                            <button
                                                key={port}
                                                type="button"
                                                onClick={() => onSmtpPortChange?.(port)}
                                                className={cn(
                                                    "px-3.5 py-1.5 rounded-lg text-[12px] font-extrabold tracking-tight transition-all duration-300",
                                                    smtpPort === port
                                                        ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-200/50 dark:ring-white/5"
                                                        : "text-slate-500 hover:text-slate-700 hover:bg-white/50 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-700/50"
                                                )}
                                            >
                                                {port}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={checkMutation.isPending || isLoading || !host.trim() || (isMapVisible && selectedNodeCount === 0)}
                                    className={cn(
                                        "h-10 px-6 sm:px-8 rounded-lg font-extrabold text-xs tracking-widest uppercase transition-all duration-300",
                                        "shadow-md active:scale-[0.98]",
                                        // Active state classes
                                        "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40",
                                        // Disabled state classes (Neutral gray for empty input / disabled action)
                                        "disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:border border-slate-200 disabled:pointer-events-none dark:disabled:bg-slate-800 dark:disabled:border-slate-700 dark:disabled:text-slate-500",
                                        isMapVisible && selectedNodeCount === 0 && "disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-300"
                                    )}
                                >
                                    {checkMutation.isPending || isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        isMapVisible && selectedNodeCount === 0 ? 'Select Nodes' : 'CHECK'
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Quick Links */}
                        {showQuickLinks && QUICK_LINKS[type] && QUICK_LINKS[type].length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 pt-3 px-2">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-1">Try it:</span>
                                {QUICK_LINKS[type].map(link => (
                                    <button
                                        key={link}
                                        type="button"
                                        disabled={isLoading || checkMutation.isPending}
                                        onClick={() => {
                                            onHostChange(link);
                                            const cleanHost = sanitizeInput(link);
                                            if (!cleanHost || isLoading || checkMutation.isPending) return;
                                            if (type === 'info' || type === 'ssl') {
                                                onCheckComplete(type);
                                            } else {
                                                checkMutation.mutate(cleanHost);
                                            }
                                        }}
                                        className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200/60 hover:border-indigo-200 dark:bg-slate-800/40 dark:hover:bg-indigo-500/10 dark:text-slate-400 dark:hover:text-indigo-400 dark:border-white/5 dark:hover:border-indigo-500/30 transition-all duration-200 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-50 dark:disabled:hover:bg-slate-800/40 disabled:hover:border-slate-200/60 dark:disabled:hover:border-white/5 disabled:hover:text-slate-600 dark:disabled:hover:text-slate-400"
                                    >
                                        {link}
                                    </button>
                                ))}
                            </div>
                        )}

                        {errorMessage && (
                            <p className={`text-[10px] font-bold uppercase tracking-wider pl-4 pt-1.5 ${errorMessage.includes('Using 1.1.1.1') ? 'text-indigo-500/70 animate-pulse' : 'text-destructive animate-bounce'}`}>
                                {errorMessage}
                            </p>
                        )}

                        {checkMutation.isError && (
                            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                                Error: {checkMutation.error?.message || 'Failed to perform check'}
                            </div>
                        )}

                        {/* Mobile view SMTP Port Selector (below input) */}
                        {type === 'smtp' && (
                            <div className="flex sm:hidden items-center justify-center gap-2 pt-2 pb-1">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mr-1">Port:</span>
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-inner">
                                    {[25, 465, 587].map((port) => (
                                        <button
                                            key={port}
                                            type="button"
                                            onClick={() => onSmtpPortChange?.(port)}
                                            className={cn(
                                                "px-5 py-2 rounded-lg text-[13px] font-extrabold tracking-tight transition-all duration-300",
                                                smtpPort === port
                                                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-200/50 dark:ring-white/5"
                                                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-700/50"
                                            )}
                                        >
                                            {port}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card >
    );
}
