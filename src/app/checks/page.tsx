'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { ResultsResponse, CheckType, Node } from '@/types/checkhost';
import { checkHostAPI } from '@/lib/checkhost-api';
import { CheckForm } from '@/components/checks/CheckForm';
import { ResultsDisplay } from '@/components/checks/ResultsDisplay';
import { ReverseMtrButton } from '@/components/checks/ReverseMtrButton';
import { Header } from '@/components/Header';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Activity, Wifi, Database, Network, Loader2, CheckCircle2, Info, ArrowLeftRight, ShieldCheck, Map as MapIcon, Globe2, X, MapPin } from 'lucide-react';
import { IpInfoResponse } from '@/types/ip-info';
import IpInfoResult from '@/components/ip-info/IpInfoResult';
import { AdSlot } from '@/components/AdSlot';
import { SslDashboard } from '@/components/checks/SslDashboard';
import { Badge } from '@/components/ui/badge';
import dynamic from 'next/dynamic';

const NodalMap = dynamic(() => import('@/components/checks/NodalMap'), {
    ssr: false,
    loading: () => (
        <div className="h-[400px] w-full rounded-2xl bg-slate-100 dark:bg-slate-900/50 animate-pulse flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <span className="text-sm font-bold uppercase tracking-widest text-indigo-500/40">Initializing Global Map...</span>
        </div>
    )
});

const tabs: CheckType[] = ['info', 'ping', 'http', 'tcp', 'udp', 'dns', 'dns-all', 'ssl', 'mtr'];

function ChecksPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [nodes, setNodes] = useState<Record<string, Node>>({});
    const [pingResults, setPingResults] = useState<ResultsResponse | null>(null);
    const [pingNodes, setPingNodes] = useState<Record<string, any>>({});

    const [httpResults, setHttpResults] = useState<ResultsResponse | null>(null);
    const [httpNodes, setHttpNodes] = useState<Record<string, any>>({});

    const [tcpResults, setTcpResults] = useState<ResultsResponse | null>(null);
    const [tcpNodes, setTcpNodes] = useState<Record<string, any>>({});

    const [udpResults, setUdpResults] = useState<ResultsResponse | null>(null);
    const [udpNodes, setUdpNodes] = useState<Record<string, any>>({});

    const [dnsResults, setDnsResults] = useState<ResultsResponse | null>(null);
    const [dnsNodes, setDnsNodes] = useState<Record<string, any>>({});

    const [dnsInfoResults, setDnsInfoResults] = useState<ResultsResponse | null>(null);
    const [dnsInfoNodes, setDnsInfoNodes] = useState<Record<string, any>>({});

    const [mtrResults, setMtrResults] = useState<ResultsResponse | null>(null);
    const [mtrNodes, setMtrNodes] = useState<Record<string, any>>({});

    const [sslResults, setSslResults] = useState<any | null>(null);

    const [ipInfoResult, setIpInfoResult] = useState<IpInfoResponse | null>(null);

    useEffect(() => {
        // Fetch available nodes on mount
        const fetchNodes = async () => {
            try {
                const fetchedNodes = await checkHostAPI.getNodes();
                setNodes(fetchedNodes);
            } catch (error) {
                console.error('Failed to fetch nodes:', error);
            }
        };
        fetchNodes();
    }, []);

    const handlePingResults = (results: ResultsResponse, checkNodes: Record<string, any>) => {
        setPingResults(results);
        setPingNodes(checkNodes);
    };

    const handleHttpResults = (results: ResultsResponse, checkNodes: Record<string, any>) => {
        setHttpResults(results);
        setHttpNodes(checkNodes);
    };

    const handleTcpResults = (results: ResultsResponse, checkNodes: Record<string, any>) => {
        setTcpResults(results);
        setTcpNodes(checkNodes);
    };

    const handleUdpResults = (results: ResultsResponse, checkNodes: Record<string, any>) => {
        setUdpResults(results);
        setUdpNodes(checkNodes);
    };

    const handleDnsResults = (results: ResultsResponse, checkNodes: Record<string, any>) => {
        setDnsResults(results);
        setDnsNodes(checkNodes);
    };

    const handleDnsInfoResults = (results: ResultsResponse, checkNodes: Record<string, any>) => {
        setDnsInfoResults(results);
        setDnsInfoNodes(checkNodes);
    };

    const handleMtrResults = (results: ResultsResponse, checkNodes: Record<string, any>) => {
        setMtrResults(results);
        setMtrNodes(checkNodes);
    };

    const [host, setHost] = useState(searchParams.get('host') || '');
    const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') || "info");
    const [pendingCheck, setPendingCheck] = useState<{ type: CheckType, host: string } | null>(null);
    const [maxNodes, setMaxNodes] = useState(20);
    const [activeChecks, setActiveChecks] = useState<Set<CheckType>>(new Set());
    const [completedChecks, setCompletedChecks] = useState<Set<CheckType>>(new Set());
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [dnsType, setDnsType] = useState<string>('all');
    const [isReverseMtr, setIsReverseMtr] = useState(false);
    const [globalCheckEnabled, setGlobalCheckEnabled] = useState(false);
    const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
    const [showMap, setShowMap] = useState(false);

    const toggleNode = (nodeId: string) => {
        setSelectedNodeIds(prev => {
            const next = [...prev];
            const index = next.indexOf(nodeId);
            if (index > -1) next.splice(index, 1);
            else next.push(nodeId);
            return next;
        });
    };

    const clearSelectedNodes = () => setSelectedNodeIds([]);

    const handleReverseMtrToggle = async (checked: boolean) => {
        if (checked) {
            setErrorMessage(null);
            try {
                const res = await fetch('/api/ip-info');
                const data = await res.json();
                if (data.ip) {
                    setHost(data.ip);
                    setIsReverseMtr(true);

                    // If we use fallback, show it in the UI
                    if (data.isFallback) {
                        setErrorMessage('Local IP detected. Using 1.1.1.1 for demo.');
                    }
                }
            } catch (e) {
                console.error('IP detection failed:', e);
                setErrorMessage('Failed to detect your public IP address.');
            }
        } else {
            setIsReverseMtr(false);
            // Optionally clear host if it was just our detected IP
            // setHost(''); 
        }
    };

    // URL Persistence Effect
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());

        if (activeTab) params.set('tab', activeTab);
        else params.delete('tab');

        if (host.trim()) params.set('host', host.trim());
        else params.delete('host');

        // Only update if params actually changed to avoid unnecessary history entries
        const currentQuery = searchParams.toString();
        const newQuery = params.toString();

        if (currentQuery !== newQuery) {
            router.replace(`${pathname}?${newQuery}`, { scroll: false });
        }
    }, [activeTab, host, pathname, router, searchParams]);

    const handleCheckStart = (type: CheckType, checkNodes: Record<string, any>, setNodesFn: (nodes: Record<string, any>) => void, setResultsFn: (res: ResultsResponse | null) => void) => {
        setActiveChecks(prev => new Set(prev).add(type));
        setCompletedChecks(prev => {
            const next = new Set(prev);
            next.delete(type);
            return next;
        });
        setNodesFn(checkNodes);
        setResultsFn({}); // Reset results to empty object (not null) to trigger loading state
    };

    const handleResultReceived = (type: CheckType, results: any, setter: (res: any) => void) => {
        setter(results);
    };

    const handleCheckComplete = (type: CheckType) => {
        setActiveChecks(prev => {
            const next = new Set(prev);
            next.delete(type);
            return next;
        });
        setCompletedChecks(prev => new Set(prev).add(type));
    };

    const runCheck = (type: CheckType, currentHost: string, refresh = false) => {
        // Sanitize - match CheckForm logic
        let sanitized = currentHost.trim();

        // Only strip protocol/path for standard checks, consistent with CheckForm
        if (type === 'ping' || type === 'dns' || type === 'tcp' || type === 'udp') {
            sanitized = sanitized.replace(/^https?:\/\//, '');
            sanitized = sanitized.split('/')[0];
        }

        if (!sanitized) return;

        // Set active state
        handleCheckStart(
            type,
            {},
            (nodes) => {
                switch (type) {
                    case 'ping': setPingNodes(nodes); break;
                    case 'http': setHttpNodes(nodes); break;
                    case 'tcp': setTcpNodes(nodes); break;
                    case 'udp': setUdpNodes(nodes); break;
                    case 'dns': setDnsNodes(nodes); break;
                    case 'dns-all': setDnsInfoNodes(nodes); break;
                    case 'mtr': setMtrNodes(nodes); break;
                    case 'ssl': break; // No nodes for SSL
                }
            },
            (results) => {
                switch (type) {
                    case 'ping': setPingResults(results); break;
                    case 'http': setHttpResults(results); break;
                    case 'tcp': setTcpResults(results); break;
                    case 'udp': setUdpResults(results); break;
                    case 'dns': setDnsResults(results); break;
                    case 'dns-all': setDnsInfoResults(results); break;
                    case 'mtr': setMtrResults(results); break;
                    case 'ssl': setSslResults(results); break;
                }
            }
        );

        if (type === 'info') {
            setIpInfoResult(null);
            fetch(`/api/ip-info?host=${encodeURIComponent(sanitized)}${refresh ? '&refresh=true' : ''}`)
                .then(res => {
                    if (!res.ok) throw new Error('API failed');
                    return res.json();
                })
                .then(data => {
                    setIpInfoResult(data);
                })
                .catch(err => {
                    console.error("IP Info check failed:", err);
                    setErrorMessage("Failed to check IP Info.");
                })
                .finally(() => {
                    handleCheckComplete('info');
                });
            return;
        }

        if (type === 'dns-all') {
            console.log(`Starting specialized DNS lookup for ${sanitized}${refresh ? ' (forced refresh)' : ''}`);
            checkHostAPI.performDnsLookup(sanitized, refresh)
                .then(dnsData => {
                    const fakeNodeId = 'dns-lookup';
                    // Even if dnsData indicates failure, we pass it to the dashboard
                    const results = { [fakeNodeId]: dnsData };
                    const checkNodes = { [fakeNodeId]: ['', '', 'Server DNS'] };
                    setDnsInfoNodes(checkNodes);
                    setDnsInfoResults(results);
                    handleCheckComplete('dns-all');
                })
                .catch(err => {
                    console.error(`DNS lookup failed:`, err);
                    setErrorMessage(err.message || "Failed to perform DNS lookup.");
                    handleCheckComplete('dns-all');
                });
            return;
        }

        if (type === 'ssl') {
            console.log(`Starting SSL check for ${sanitized}`);
            fetch(`/api/ssl-check?host=${encodeURIComponent(sanitized)}`)
                .then(async res => {
                    const data = await res.json();
                    if (!res.ok) {
                        throw new Error(data.error || 'SSL check failed');
                    }
                    return data;
                })
                .then(data => {
                    setSslResults(data);
                    handleCheckComplete('ssl');
                })
                .catch(err => {
                    console.error(`SSL check failed:`, err);
                    setErrorMessage(err.message || "Failed to perform SSL check.");
                    handleCheckComplete('ssl');
                });
            return;
        }

        console.log(`Starting check for ${type} on ${sanitized}`);

        checkHostAPI.performCheck(
            type,
            sanitized,
            { maxNodes, nodes: selectedNodeIds.length > 0 ? selectedNodeIds : undefined },
            (results) => {
                switch (type) {
                    case 'ping': setPingResults(results); break;
                    case 'http': setHttpResults(results); break;
                    case 'tcp': setTcpResults(results); break;
                    case 'udp': setUdpResults(results); break;
                    case 'dns': setDnsResults(results); break;
                    case 'mtr': setMtrResults(results); break;
                }
            },
            (initResponse) => {
                switch (type) {
                    case 'ping': setPingNodes(initResponse.nodes); break;
                    case 'http': setHttpNodes(initResponse.nodes); break;
                    case 'tcp': setTcpNodes(initResponse.nodes); break;
                    case 'udp': setUdpNodes(initResponse.nodes); break;
                    case 'dns': setDnsNodes(initResponse.nodes); break;
                    case 'mtr': setMtrNodes(initResponse.nodes); break;
                }
            }
        )
            .catch((err) => {
                console.error(`Check failed for ${type}:`, err);
                setErrorMessage(err.message || "Failed to perform check. Please try again.");
            })
            .finally(() => {
                handleCheckComplete(type);
            });
    };

    const handleCheckAll = () => {
        if (!host.trim()) {
            setErrorMessage('Please enter a valid domain or IP address');
            return;
        }
        setErrorMessage(null);

        const checkTypes: CheckType[] = ['info', 'ping', 'http', 'tcp', 'udp', 'dns', 'dns-all', 'ssl'];

        // Mark all as active immediately and clear completed
        setActiveChecks(new Set(checkTypes));
        setCompletedChecks(new Set());

        // Reset results to trigger UI loading
        setPingResults({});
        setHttpResults({});
        setTcpResults({});
        setUdpResults({});
        setDnsResults({});
        setDnsInfoResults({});
        setSslResults(null);

        checkTypes.forEach(type => {
            runCheck(type, host);
        });
    };

    const handleTabCheck = (type: CheckType) => {
        // Disable auto-run for specific types as requested
        const manualTypes = ['ping', 'http', 'tcp', 'udp', 'dns', 'mtr'];
        if (manualTypes.includes(type)) return;

        if (!host.trim()) {
            setErrorMessage('Please enter a domain or IP to start check');
            return;
        }
        setErrorMessage(null);
        setPendingCheck({ type, host });
    };

    const onHostChange = (newHost: string) => {
        setHost(newHost);
        setIsReverseMtr(false); // Reset reverse mode on manual change
        if (newHost.trim()) {
            setErrorMessage(null);
        }
    };

    // Initial load effects
    useEffect(() => {
        const fetchFeatures = async () => {
            try {
                const res = await fetch('/api/admin/settings?key=feature_flags');
                if (res.ok) {
                    const data = await res.json();
                    if (data && typeof data.globalCheckEnabled === 'boolean') {
                        setGlobalCheckEnabled(data.globalCheckEnabled);
                    }
                }
            } catch (e) {
                console.error('Failed to fetch feature flags:', e);
            }
        };
        fetchFeatures();

        // Check for reverse MTR or direct host checks on mount
        const reverse = searchParams.get('reverse');
        const tab = searchParams.get('tab') as CheckType | null;
        const hostParam = searchParams.get('host');

        if (reverse === 'true' && tab === 'mtr' && hostParam) {
            setIsReverseMtr(true);
            setHost(hostParam);
            setActiveTab('mtr');
            setTimeout(() => runCheck('mtr', hostParam), 500);
        } else if (hostParam && tab && tab !== 'info') {
            // Auto-trigger check if host and specific tab are provided (except info/dns-all which are mostly static or have their own logic)
            const autoTypes: CheckType[] = ['ping', 'http', 'tcp', 'udp', 'dns', 'mtr'];
            if (autoTypes.includes(tab)) {
                setTimeout(() => runCheck(tab, hostParam), 500);
            }
        }
    }, []);

    // Initial check when tab becomes active (if pending)
    useEffect(() => {
        if (pendingCheck && activeTab === pendingCheck.type) {
            // Small delay to ensure UI is ready
            const timer = setTimeout(() => {
                runCheck(pendingCheck.type, pendingCheck.host);
                setPendingCheck(null);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [activeTab, pendingCheck]);

    const handlePingIp = (ip: string) => {
        setHost(ip);
        // Clear previous info results to avoid confusion
        setIpInfoResult(null);
        setActiveTab("info");
        // Trigger info check with the IP
        setTimeout(() => {
            runCheck('info', ip);
        }, 100);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 transition-colors duration-500 relative overflow-hidden">
            {/* Mesh Gradient Effect for Dark Mode */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-100 hidden dark:block">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <Header />

                {/* Main Content */}
                <div className="container mx-auto px-4 py-8 flex-1">
                    <div className="max-w-5xl mx-auto">
                        {/* Tabs Navigation */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full relative">
                            <div className="flex flex-col items-center justify-center gap-3 mb-4">
                                {/* Mobile Navigation (Popover Menu) */}
                                <div className="w-full max-w-sm md:hidden mx-auto">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="w-full h-10 px-4 flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                                                {activeTab === 'info' && <Info className="h-4 w-4 text-indigo-500" />}
                                                {activeTab === 'ping' && <Wifi className="h-4 w-4 text-indigo-500" />}
                                                {(activeTab === 'http' || activeTab === 'dns' || activeTab === 'mtr') && <Activity className="h-4 w-4 text-indigo-500" />}
                                                {activeTab === 'tcp' && <Network className="h-4 w-4 text-indigo-500" />}
                                                {(activeTab === 'udp' || activeTab === 'dns-all') && <Database className="h-4 w-4 text-indigo-500" />}
                                                {activeTab === 'ssl' && <ShieldCheck className="h-4 w-4 text-indigo-500" />}
                                                <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                                                    {activeTab === 'dns-all' ? 'DNS Info' : activeTab.toUpperCase()}
                                                </span>
                                                <ChevronDown className="h-4 w-4 text-slate-400 ml-auto" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 p-4" align="center">
                                            <div className="grid grid-cols-3 gap-2">
                                                <button
                                                    onClick={() => { setActiveTab('info'); handleTabCheck('info'); }}
                                                    className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${activeTab === 'info'
                                                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                                        }`}
                                                >
                                                    <Info className="h-5 w-5" />
                                                    <span className="text-xs font-medium">Info</span>
                                                </button>
                                                <button
                                                    onClick={() => { setActiveTab('ping'); handleTabCheck('ping'); }}
                                                    className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${activeTab === 'ping'
                                                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                                        }`}
                                                >
                                                    <Wifi className="h-5 w-5" />
                                                    <span className="text-xs font-medium">Ping</span>
                                                </button>
                                                <button
                                                    onClick={() => { setActiveTab('http'); handleTabCheck('http'); }}
                                                    className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${activeTab === 'http'
                                                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                                        }`}
                                                >
                                                    <Activity className="h-5 w-5" />
                                                    <span className="text-xs font-medium">HTTP</span>
                                                </button>
                                                <button
                                                    onClick={() => { setActiveTab('tcp'); handleTabCheck('tcp'); }}
                                                    className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${activeTab === 'tcp'
                                                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                                        }`}
                                                >
                                                    <Network className="h-5 w-5" />
                                                    <span className="text-xs font-medium">TCP</span>
                                                </button>
                                                <button
                                                    onClick={() => { setActiveTab('udp'); handleTabCheck('udp'); }}
                                                    className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${activeTab === 'udp'
                                                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                                        }`}
                                                >
                                                    <Database className="h-5 w-5" />
                                                    <span className="text-xs font-medium">UDP</span>
                                                </button>
                                                <button
                                                    onClick={() => { setActiveTab('dns'); handleTabCheck('dns'); }}
                                                    className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${activeTab === 'dns'
                                                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                                        }`}
                                                >
                                                    <Activity className="h-5 w-5" />
                                                    <span className="text-xs font-medium">DNS</span>
                                                </button>
                                                <button
                                                    onClick={() => { setActiveTab('mtr'); handleTabCheck('mtr'); }}
                                                    className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${activeTab === 'mtr'
                                                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                                        }`}
                                                >
                                                    <Activity className="h-5 w-5" />
                                                    <span className="text-xs font-medium">MTR</span>
                                                </button>
                                                <button
                                                    onClick={() => { setActiveTab('dns-all'); handleTabCheck('dns-all'); }}
                                                    className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${activeTab === 'dns-all'
                                                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                                        }`}
                                                >
                                                    <Database className="h-5 w-5" />
                                                    <span className="text-xs font-medium">DNS Info</span>
                                                </button>
                                                <button
                                                    onClick={() => { setActiveTab('ssl'); handleTabCheck('ssl'); }}
                                                    className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${activeTab === 'ssl'
                                                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                                        }`}
                                                >
                                                    <ShieldCheck className="h-5 w-5" />
                                                    <span className="text-xs font-medium">SSL</span>
                                                </button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>



                                {/* Desktop Navigation (Tabs) */}
                                <TabsList className="hidden md:flex w-auto h-12 p-1 bg-slate-200/40 dark:bg-slate-900/60 rounded-xl border border-slate-200/50 dark:border-white/5 items-center gap-1">
                                    <TabsTrigger value="info" className="gap-2 px-4 relative data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all duration-200" onClick={() => handleTabCheck('info')}>
                                        <Info className="h-4 w-4" />
                                        <span>Info</span>
                                        {activeChecks.has('info') ? (
                                            <Loader2 className="h-3 w-3 animate-spin absolute -top-1 right-0 z-10 text-primary" />
                                        ) : completedChecks.has('info') ? (
                                            <CheckCircle2 className="h-3 w-3 absolute -top-1 right-0 z-10 text-green-500" />
                                        ) : null}
                                    </TabsTrigger>
                                    <TabsTrigger value="ping" className="gap-2 px-4 relative data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all duration-200" onClick={() => handleTabCheck('ping')}>
                                        <Wifi className="h-4 w-4" />
                                        <span>Ping</span>
                                        {activeChecks.has('ping') ? (
                                            <Loader2 className="h-3 w-3 animate-spin absolute -top-1 right-0 z-10 text-primary" />
                                        ) : completedChecks.has('ping') ? (
                                            <CheckCircle2 className="h-3 w-3 absolute -top-1 right-0 z-10 text-green-500" />
                                        ) : null}
                                    </TabsTrigger>
                                    <TabsTrigger value="http" className="gap-2 px-4 relative data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all duration-200" onClick={() => handleTabCheck('http')}>
                                        <Activity className="h-4 w-4" />
                                        <span>HTTP</span>
                                        {activeChecks.has('http') ? (
                                            <Loader2 className="h-3 w-3 animate-spin absolute -top-1 right-0 z-10 text-primary" />
                                        ) : completedChecks.has('http') ? (
                                            <CheckCircle2 className="h-3 w-3 absolute -top-1 right-0 z-10 text-green-500" />
                                        ) : null}
                                    </TabsTrigger>
                                    <TabsTrigger value="tcp" className="gap-2 px-4 relative data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all duration-200" onClick={() => handleTabCheck('tcp')}>
                                        <Network className="h-4 w-4" />
                                        <span>TCP</span>
                                        {activeChecks.has('tcp') ? (
                                            <Loader2 className="h-3 w-3 animate-spin absolute -top-1 right-0 z-10 text-primary" />
                                        ) : completedChecks.has('tcp') ? (
                                            <CheckCircle2 className="h-3 w-3 absolute -top-1 right-0 z-10 text-green-500" />
                                        ) : null}
                                    </TabsTrigger>
                                    <TabsTrigger value="udp" className="gap-2 px-4 relative data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all duration-200" onClick={() => handleTabCheck('udp')}>
                                        <Database className="h-4 w-4" />
                                        <span>UDP</span>
                                        {activeChecks.has('udp') ? (
                                            <Loader2 className="h-3 w-3 animate-spin absolute -top-1 right-0 z-10 text-primary" />
                                        ) : completedChecks.has('udp') ? (
                                            <CheckCircle2 className="h-3 w-3 absolute -top-1 right-0 z-10 text-green-500" />
                                        ) : null}
                                    </TabsTrigger>
                                    <TabsTrigger value="dns" className="gap-2 px-4 relative data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all duration-200" onClick={() => handleTabCheck('dns')}>
                                        <Activity className="h-4 w-4" />
                                        <span>DNS</span>
                                        {activeChecks.has('dns') ? (
                                            <Loader2 className="h-3 w-3 animate-spin absolute -top-1 right-0 z-10 text-primary" />
                                        ) : completedChecks.has('dns') ? (
                                            <CheckCircle2 className="h-3 w-3 absolute -top-1 right-0 z-10 text-green-500" />
                                        ) : null}
                                    </TabsTrigger>
                                    <TabsTrigger value="mtr" className="gap-2 px-4 relative data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all duration-200" onClick={() => handleTabCheck('mtr')}>
                                        <Activity className="h-4 w-4" />
                                        <span>MTR</span>
                                        {activeChecks.has('mtr') ? (
                                            <Loader2 className="h-3 w-3 animate-spin absolute -top-1 right-0 z-10 text-primary" />
                                        ) : completedChecks.has('mtr') ? (
                                            <CheckCircle2 className="h-3 w-3 absolute -top-1 right-0 z-10 text-green-500" />
                                        ) : null}
                                    </TabsTrigger>
                                    <TabsTrigger value="dns-all" className="gap-2 px-4 relative data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all duration-200" onClick={() => handleTabCheck('dns-all')}>
                                        <Database className="h-4 w-4" />
                                        <span>DNS Info</span>
                                        {activeChecks.has('dns-all') ? (
                                            <Loader2 className="h-3 w-3 animate-spin absolute -top-1 right-0 z-10 text-primary" />
                                        ) : completedChecks.has('dns-all') ? (
                                            <CheckCircle2 className="h-3 w-3 absolute -top-1 right-0 z-10 text-green-500" />
                                        ) : null}
                                    </TabsTrigger>
                                    <TabsTrigger value="ssl" className="gap-2 px-4 relative data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all duration-200" onClick={() => handleTabCheck('ssl')}>
                                        <ShieldCheck className="h-4 w-4" />
                                        <span>SSL</span>
                                        {activeChecks.has('ssl') ? (
                                            <Loader2 className="h-3 w-3 animate-spin absolute -top-1 right-0 z-10 text-primary" />
                                        ) : completedChecks.has('ssl') ? (
                                            <CheckCircle2 className="h-3 w-3 absolute -top-1 right-0 z-10 text-green-500" />
                                        ) : null}
                                    </TabsTrigger>
                                </TabsList>

                                <div className="flex gap-2">
                                    {globalCheckEnabled && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-12 px-5 opacity-60 hover:opacity-100 bg-white dark:bg-slate-900 border-slate-200/60 dark:border-white/5 text-slate-900 dark:text-slate-100 shadow-sm transition-all duration-300 rounded-xl whitespace-nowrap hidden md:flex items-center gap-2 group"
                                            onClick={handleCheckAll}
                                            disabled={!host.trim()}
                                            title="Initiate check across all types"
                                        >
                                            <Activity className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                            <span className="font-bold text-xs">Global Check</span>
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="mt-0">
                                {/* Info Tab */}
                                <TabsContent value="info" className="space-y-4">
                                    <div className="space-y-4">
                                        <CheckForm
                                            type="info"
                                            host={host}
                                            maxNodes={maxNodes}
                                            onMaxNodesChange={setMaxNodes}
                                            onHostChange={onHostChange}
                                            onResults={() => { }}
                                            onCheckStart={() => { }}
                                            onCheckComplete={() => {
                                                if (host.trim()) {
                                                    runCheck('info', host);
                                                }
                                            }}
                                            errorMessage={errorMessage}
                                            isLoading={activeChecks.has('info')}
                                            nodes={nodes}
                                            isReverseMtr={isReverseMtr}
                                            onReverseMtrToggle={handleReverseMtrToggle}
                                            selectedNodeCount={selectedNodeIds.length}
                                            selectedNodeIds={selectedNodeIds}
                                        />
                                        {activeChecks.has('info') ? (
                                            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground animate-pulse gap-4 mt-8">
                                                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                                                <span>Obtaining global IP intelligence...</span>
                                            </div>
                                        ) : ipInfoResult ? (
                                            <IpInfoResult
                                                data={ipInfoResult}
                                                onRefresh={() => runCheck('info', host, true)}
                                                isRefreshing={activeChecks.has('info')}
                                            />
                                        ) : null}

                                    </div>
                                </TabsContent>

                                {/* Ping Tab */}
                                <TabsContent value="ping" className="space-y-4">
                                    <div className="space-y-4">
                                        <CheckForm
                                            type="ping"
                                            host={host}
                                            maxNodes={maxNodes}
                                            onMaxNodesChange={setMaxNodes}
                                            onHostChange={onHostChange}
                                            onResults={handlePingResults}
                                            onCheckStart={(nodes) => handleCheckStart('ping', nodes, setPingNodes, setPingResults)}
                                            onCheckComplete={() => handleCheckComplete('ping')}
                                            errorMessage={errorMessage}
                                            isLoading={activeChecks.has('ping')}
                                            onProgress={setPingResults}
                                            nodes={nodes}
                                            isReverseMtr={isReverseMtr}
                                            onReverseMtrToggle={handleReverseMtrToggle}
                                            selectedNodeCount={selectedNodeIds.length}
                                            selectedNodeIds={selectedNodeIds}
                                            onToggleMap={() => setShowMap(!showMap)}
                                            onClearSelection={clearSelectedNodes}
                                        />

                                        {/* Nodal Network Map (Looking Glass Phase 2) */}
                                        {showMap && (
                                            <div className="mb-6 space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                                                <div className="flex items-center justify-between px-2">
                                                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                        <MapIcon className="h-3 w-3 text-indigo-500" />
                                                        Nodal Selection Map
                                                    </h3>
                                                    <div className="flex items-center gap-2">
                                                        {selectedNodeIds.length > 0 && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 text-[10px] font-bold text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                                                                onClick={clearSelectedNodes}
                                                            >
                                                                <X className="h-3 w-3" />
                                                                Clear Selection
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                                            onClick={() => setShowMap(false)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <NodalMap
                                                    nodes={nodes}
                                                    selectedNodeIds={selectedNodeIds}
                                                    onToggleNode={toggleNode}
                                                />
                                                {selectedNodeIds.length > 0 && (
                                                    <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-center gap-3">
                                                        <div className="h-6 w-6 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                                                            <MapPin className="h-3 w-3 text-indigo-500" />
                                                        </div>
                                                        <div className="flex-1 overflow-hidden">
                                                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Manual Node Filters Active:</p>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {selectedNodeIds.map(id => (
                                                                    <Badge key={id} variant="secondary" className="text-[9px] px-1.5 py-0 rounded-md bg-white dark:bg-slate-800 border-slate-200 dark:border-white/5 font-mono">
                                                                        {id}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {(pingResults || Object.keys(pingNodes).length > 0 || activeChecks.has('ping')) && (
                                            <ResultsDisplay results={pingResults || {}} checkType="ping" nodes={nodes} activeNodes={pingNodes} targetHost={host} isLoading={activeChecks.has('ping')} />
                                        )}
                                    </div>
                                </TabsContent>

                                {/* HTTP Tab */}
                                <TabsContent value="http" className="space-y-4">
                                    <div className="space-y-4">
                                        <CheckForm
                                            type="http"
                                            host={host}
                                            maxNodes={maxNodes}
                                            onMaxNodesChange={setMaxNodes}
                                            onHostChange={onHostChange}
                                            onResults={handleHttpResults}
                                            onCheckStart={(nodes) => handleCheckStart('http', nodes, setHttpNodes, setHttpResults)}
                                            onCheckComplete={() => handleCheckComplete('http')}
                                            errorMessage={errorMessage}
                                            isLoading={activeChecks.has('http')}
                                            onProgress={setHttpResults}
                                            nodes={nodes}
                                            isReverseMtr={isReverseMtr}
                                            onReverseMtrToggle={handleReverseMtrToggle}
                                            selectedNodeCount={selectedNodeIds.length}
                                            selectedNodeIds={selectedNodeIds}
                                            onToggleMap={() => setShowMap(!showMap)}
                                            onClearSelection={clearSelectedNodes}
                                        />

                                        {/* Nodal Network Map (Looking Glass Phase 2) */}
                                        {showMap && (
                                            <div className="mb-6 space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                                                {/* Same Map Block... repeating it for simplicity in edits */}
                                                <div className="flex items-center justify-between px-2">
                                                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                        <MapIcon className="h-3 w-3 text-indigo-500" />
                                                        Nodal Selection Map
                                                    </h3>
                                                    <div className="flex items-center gap-2">
                                                        {selectedNodeIds.length > 0 && (
                                                            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5" onClick={clearSelectedNodes}>
                                                                <X className="h-3 w-3" /> Clear Selection
                                                            </Button>
                                                        )}
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" onClick={() => setShowMap(false)}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <NodalMap nodes={nodes} selectedNodeIds={selectedNodeIds} onToggleNode={toggleNode} />
                                                {selectedNodeIds.length > 0 && (
                                                    <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-center gap-3">
                                                        <div className="h-6 w-6 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                                                            <MapPin className="h-3 w-3 text-indigo-500" />
                                                        </div>
                                                        <div className="flex-1 overflow-hidden">
                                                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Manual Node Filters Active:</p>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {selectedNodeIds.map(id => (<Badge key={id} variant="secondary" className="text-[9px] px-1.5 py-0 rounded-md bg-white dark:bg-slate-800 border-slate-200 dark:border-white/5 font-mono">{id}</Badge>))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {(httpResults || Object.keys(httpNodes).length > 0 || activeChecks.has('http')) && (
                                            <ResultsDisplay results={httpResults || {}} checkType="http" nodes={nodes} activeNodes={httpNodes} targetHost={host} isLoading={activeChecks.has('http')} />
                                        )}
                                    </div>
                                </TabsContent>

                                {/* TCP Tab */}
                                <TabsContent value="tcp" className="space-y-4">
                                    <div className="space-y-4">
                                        <CheckForm
                                            type="tcp"
                                            host={host}
                                            maxNodes={maxNodes}
                                            onMaxNodesChange={setMaxNodes}
                                            onHostChange={onHostChange}
                                            onResults={handleTcpResults}
                                            onCheckStart={(nodes) => handleCheckStart('tcp', nodes, setTcpNodes, setTcpResults)}
                                            onCheckComplete={() => handleCheckComplete('tcp')}
                                            errorMessage={errorMessage}
                                            isLoading={activeChecks.has('tcp')}
                                            onProgress={setTcpResults}
                                            nodes={nodes}
                                            isReverseMtr={isReverseMtr}
                                            onReverseMtrToggle={handleReverseMtrToggle}
                                            selectedNodeCount={selectedNodeIds.length}
                                            selectedNodeIds={selectedNodeIds}
                                            onToggleMap={() => setShowMap(!showMap)}
                                            onClearSelection={clearSelectedNodes}
                                        />

                                        {showMap && (
                                            <div className="mb-6 space-y-3 animate-in fade-in slide-in-from-top-4 duration-500 text-left">
                                                <div className="flex items-center justify-between px-2">
                                                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                        <MapIcon className="h-3 w-3 text-indigo-500" />
                                                        Nodal Selection Map
                                                    </h3>
                                                    <div className="flex items-center gap-2">
                                                        {selectedNodeIds.length > 0 && (
                                                            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5" onClick={clearSelectedNodes}>
                                                                <X className="h-3 w-3" /> Clear Selection
                                                            </Button>
                                                        )}
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" onClick={() => setShowMap(false)}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <NodalMap nodes={nodes} selectedNodeIds={selectedNodeIds} onToggleNode={toggleNode} />
                                            </div>
                                        )}
                                        {(tcpResults || Object.keys(tcpNodes).length > 0 || activeChecks.has('tcp')) && (
                                            <ResultsDisplay results={tcpResults || {}} checkType="tcp" nodes={nodes} activeNodes={tcpNodes} targetHost={host} isLoading={activeChecks.has('tcp')} />
                                        )}
                                    </div>
                                </TabsContent>

                                {/* UDP Tab */}
                                <TabsContent value="udp" className="space-y-4">
                                    <div className="space-y-4">
                                        <CheckForm
                                            type="udp"
                                            host={host}
                                            maxNodes={maxNodes}
                                            onMaxNodesChange={setMaxNodes}
                                            onHostChange={onHostChange}
                                            onResults={handleUdpResults}
                                            onCheckStart={(nodes) => handleCheckStart('udp', nodes, setUdpNodes, setUdpResults)}
                                            onCheckComplete={() => handleCheckComplete('udp')}
                                            errorMessage={errorMessage}
                                            isLoading={activeChecks.has('udp')}
                                            onProgress={setUdpResults}
                                            nodes={nodes}
                                            isReverseMtr={isReverseMtr}
                                            onReverseMtrToggle={handleReverseMtrToggle}
                                            selectedNodeCount={selectedNodeIds.length}
                                            selectedNodeIds={selectedNodeIds}
                                            onToggleMap={() => setShowMap(!showMap)}
                                            onClearSelection={clearSelectedNodes}
                                        />

                                        {showMap && (
                                            <div className="mb-6 space-y-3 animate-in fade-in slide-in-from-top-4 duration-500 text-left">
                                                <div className="flex items-center justify-between px-2">
                                                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                        <MapIcon className="h-3 w-3 text-indigo-500" />
                                                        Nodal Selection Map
                                                    </h3>
                                                    <div className="flex items-center gap-2">
                                                        {selectedNodeIds.length > 0 && (
                                                            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5" onClick={clearSelectedNodes}>
                                                                <X className="h-3 w-3" /> Clear Selection
                                                            </Button>
                                                        )}
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" onClick={() => setShowMap(false)}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <NodalMap nodes={nodes} selectedNodeIds={selectedNodeIds} onToggleNode={toggleNode} />
                                            </div>
                                        )}
                                        {(udpResults || Object.keys(udpNodes).length > 0 || activeChecks.has('udp')) && (
                                            <ResultsDisplay results={udpResults || {}} checkType="udp" nodes={nodes} activeNodes={udpNodes} targetHost={host} isLoading={activeChecks.has('udp')} />
                                        )}
                                    </div>
                                </TabsContent>

                                {/* DNS Tab */}
                                <TabsContent value="dns" className="space-y-4">
                                    <div className="space-y-4">
                                        <CheckForm
                                            type="dns"
                                            host={host}
                                            maxNodes={maxNodes}
                                            onMaxNodesChange={setMaxNodes}
                                            onHostChange={onHostChange}
                                            onResults={handleDnsResults}
                                            onCheckStart={(nodes) => handleCheckStart('dns', nodes, setDnsNodes, setDnsResults)}
                                            onCheckComplete={() => handleCheckComplete('dns')}
                                            errorMessage={errorMessage}
                                            isLoading={activeChecks.has('dns')}
                                            onProgress={setDnsResults}
                                            nodes={nodes}
                                            isReverseMtr={isReverseMtr}
                                            onReverseMtrToggle={handleReverseMtrToggle}
                                            selectedNodeCount={selectedNodeIds.length}
                                            selectedNodeIds={selectedNodeIds}
                                            onToggleMap={() => setShowMap(!showMap)}
                                            onClearSelection={clearSelectedNodes}
                                        />

                                        {showMap && (
                                            <div className="mb-6 space-y-3 animate-in fade-in slide-in-from-top-4 duration-500 text-left">
                                                <div className="flex items-center justify-between px-2">
                                                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                        <MapIcon className="h-3 w-3 text-indigo-500" />
                                                        Nodal Selection Map
                                                    </h3>
                                                    <div className="flex items-center gap-2">
                                                        {selectedNodeIds.length > 0 && (
                                                            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5" onClick={clearSelectedNodes}>
                                                                <X className="h-3 w-3" /> Clear Selection
                                                            </Button>
                                                        )}
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" onClick={() => setShowMap(false)}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <NodalMap nodes={nodes} selectedNodeIds={selectedNodeIds} onToggleNode={toggleNode} />
                                            </div>
                                        )}
                                        {(dnsResults || Object.keys(dnsNodes).length > 0 || activeChecks.has('dns')) && (
                                            <ResultsDisplay
                                                results={dnsResults || {}}
                                                checkType="dns"
                                                nodes={nodes}
                                                activeNodes={dnsNodes}
                                                dnsType={dnsType}
                                                onDnsTypeChange={setDnsType}
                                                targetHost={host}
                                                isLoading={activeChecks.has('dns')}
                                            />
                                        )}
                                    </div>
                                </TabsContent>

                                {/* MTR Tab */}
                                <TabsContent value="mtr" className="space-y-4">
                                    <div className="space-y-4">
                                        <CheckForm
                                            type="mtr"
                                            host={host}
                                            maxNodes={maxNodes}
                                            onMaxNodesChange={setMaxNodes}
                                            onHostChange={onHostChange}
                                            onResults={handleMtrResults}
                                            onCheckStart={(nodes) => handleCheckStart('mtr', nodes, setMtrNodes, setMtrResults)}
                                            onCheckComplete={() => handleCheckComplete('mtr')}
                                            errorMessage={errorMessage}
                                            isLoading={activeChecks.has('mtr')}
                                            onProgress={setMtrResults}
                                            nodes={nodes}
                                            isReverseMtr={isReverseMtr}
                                            onReverseMtrToggle={handleReverseMtrToggle}
                                            selectedNodeCount={selectedNodeIds.length}
                                            selectedNodeIds={selectedNodeIds}
                                            onToggleMap={() => setShowMap(!showMap)}
                                            onClearSelection={clearSelectedNodes}
                                        />

                                        {showMap && (
                                            <div className="mb-6 space-y-3 animate-in fade-in slide-in-from-top-4 duration-500 text-left">
                                                <div className="flex items-center justify-between px-2">
                                                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                        <MapIcon className="h-3 w-3 text-indigo-500" />
                                                        Nodal Selection Map
                                                    </h3>
                                                    <div className="flex items-center gap-2">
                                                        {selectedNodeIds.length > 0 && (
                                                            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5" onClick={clearSelectedNodes}>
                                                                <X className="h-3 w-3" /> Clear Selection
                                                            </Button>
                                                        )}
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" onClick={() => setShowMap(false)}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <NodalMap nodes={nodes} selectedNodeIds={selectedNodeIds} onToggleNode={toggleNode} />
                                            </div>
                                        )}
                                        {(mtrResults || Object.keys(mtrNodes).length > 0 || activeChecks.has('mtr')) && (
                                            <>

                                                <ResultsDisplay
                                                    results={mtrResults || {}}
                                                    checkType="mtr"
                                                    nodes={nodes}
                                                    activeNodes={mtrNodes}
                                                    targetHost={host}
                                                    onPingIp={handlePingIp}
                                                    isLoading={activeChecks.has('mtr')}
                                                />
                                            </>
                                        )}
                                    </div>
                                </TabsContent>

                                {/* DNS Info Tab */}
                                <TabsContent value="dns-all" className="space-y-4">
                                    <div className="space-y-4">
                                        <CheckForm
                                            type="dns-all"
                                            host={host}
                                            maxNodes={maxNodes}
                                            onMaxNodesChange={setMaxNodes}
                                            onHostChange={onHostChange}
                                            onResults={handleDnsInfoResults}
                                            onCheckStart={(nodes) => handleCheckStart('dns-all', nodes, setDnsInfoNodes, setDnsInfoResults)}
                                            onCheckComplete={() => handleCheckComplete('dns-all')}
                                            errorMessage={errorMessage}
                                            isLoading={activeChecks.has('dns-all')}
                                            onProgress={setDnsInfoResults}
                                            nodes={nodes}
                                            dnsType={dnsType}
                                            onDnsTypeChange={setDnsType}
                                            isReverseMtr={isReverseMtr}
                                            onReverseMtrToggle={handleReverseMtrToggle}
                                            selectedNodeCount={selectedNodeIds.length}
                                            selectedNodeIds={selectedNodeIds}
                                        />
                                        {(dnsInfoResults || Object.keys(dnsInfoNodes).length > 0 || activeChecks.has('dns-all')) && (
                                            <div className="space-y-4">
                                                <ResultsDisplay
                                                    results={dnsInfoResults || {}}
                                                    checkType="dns-all"
                                                    nodes={nodes}
                                                    activeNodes={dnsInfoNodes}
                                                    dnsType={dnsType}
                                                    onDnsTypeChange={setDnsType}
                                                    targetHost={host}
                                                    isLoading={activeChecks.has('dns-all')}
                                                    onRefresh={() => runCheck('dns-all', host, true)}
                                                    isRefreshing={activeChecks.has('dns-all')}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                {/* SSL Tab */}
                                <TabsContent value="ssl" className="space-y-4">
                                    <div className="space-y-4">
                                        <CheckForm
                                            type="ssl"
                                            host={host}
                                            maxNodes={maxNodes}
                                            onMaxNodesChange={setMaxNodes}
                                            onHostChange={onHostChange}
                                            onResults={() => { }}
                                            onCheckStart={() => {
                                                setActiveChecks(prev => new Set(prev).add('ssl'));
                                                setSslResults(null);
                                            }}
                                            onCheckComplete={() => {
                                                if (host.trim()) {
                                                    runCheck('ssl', host);
                                                }
                                            }}
                                            errorMessage={errorMessage}
                                            isLoading={activeChecks.has('ssl')}
                                            nodes={nodes}
                                            isReverseMtr={isReverseMtr}
                                            onReverseMtrToggle={handleReverseMtrToggle}
                                            selectedNodeCount={selectedNodeIds.length}
                                            selectedNodeIds={selectedNodeIds}
                                        />
                                        {activeChecks.has('ssl') ? (
                                            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground animate-pulse gap-4 mt-8">
                                                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                                                <span>Inspecting certificates and chains...</span>
                                            </div>
                                        ) : sslResults ? (
                                            <SslDashboard data={sslResults} />
                                        ) : null}
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>

                        <AdSlot slotType="results_bottom" className="mt-12" />
                    </div>
                </div>

                {/* Footer */}
                <footer className="container mx-auto px-4 py-12 mt-auto text-center text-slate-400 dark:text-slate-500 border-t border-slate-200/50 dark:border-white/5">
                    <p className="text-sm font-medium">© 2026 CheckHost.net — Website Monitoring Made Simple</p>
                </footer>
            </div >
        </div >
    );
}

export default function ChecksPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F1A] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
                    <p className="text-slate-500 animate-pulse font-medium">Loading Diagnostic Tools...</p>
                </div>
            </div>
        }>
            <ChecksPageContent />
        </Suspense>
    );
}
