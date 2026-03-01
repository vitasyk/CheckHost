'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { ResultsResponse, CheckType, Node } from '@/types/checkhost';
import { checkHostAPI } from '@/lib/checkhost-api';
import { CheckForm } from '@/components/checks/CheckForm';
import { ResultsDisplay } from '@/components/checks/ResultsDisplay';
import { SslDashboard } from '@/components/checks/SslDashboard';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, Activity, Wifi, Database, Network, Loader2, CheckCircle2, Info, Map as Globe, Zap, FileText, Shield, } from 'lucide-react';
import { IpInfoResponse } from '@/types/ip-info';
import IpInfoResult from '@/components/ip-info/IpInfoResult';
import { AdSlot } from '@/components/AdSlot';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
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

const getTabIcon = (t: string) => {
    switch (t) {
        case 'info': return <Info className="h-4 w-4" />;
        case 'ping': return <Wifi className="h-4 w-4" />;
        case 'http': return <Globe className="h-4 w-4" />;
        case 'tcp': return <Network className="h-4 w-4" />;
        case 'udp': return <Zap className="h-4 w-4" />;
        case 'dns': return <Database className="h-4 w-4" />;
        case 'mtr': return <Activity className="h-4 w-4" />;
        case 'dns-all': return <FileText className="h-4 w-4" />;
        case 'ssl': return <Shield className="h-4 w-4" />;
        default: return null;
    }
};

function ChecksPageContent({ initialHost, initialTab, autoStart }: { initialHost?: string, initialTab?: string, autoStart?: boolean }) {
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

    const [host, setHost] = useState(initialHost || searchParams.get('host') || '');
    const [activeTab, setActiveTab] = useState<string>(initialTab || searchParams.get('tab') || "info");

    // Sync activeTab when URL changes externally (e.g. footer links)
    useEffect(() => {
        const tabFromUrl = searchParams.get('tab');
        if (tabFromUrl && tabFromUrl !== activeTab) {
            setActiveTab(tabFromUrl);
        }
    }, [searchParams]);

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
        }
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (activeTab) params.set('tab', activeTab);
            else params.delete('tab');
            if (host.trim()) params.set('host', host.trim());
            else params.delete('host');

            const currentQuery = searchParams.toString();
            const newQuery = params.toString();
            if (currentQuery !== newQuery) {
                router.replace(`${pathname}?${newQuery}`, { scroll: false });
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [activeTab, host, pathname, router, searchParams]);

    const handleCheckStart = (type: CheckType, checkNodes: Record<string, any>, setNodesFn: (nodes: Record<string, any>) => void, setResultsFn: (res: ResultsResponse | null) => void) => {
        setActiveChecks(prev => new Set(prev).add(type));
        setCompletedChecks(prev => {
            const next = new Set(prev);
            next.delete(type);
            return next;
        });
        setNodesFn(checkNodes);
        setResultsFn({});
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
        let sanitized = currentHost.trim();

        // Special sanitization for ASN
        if (type === 'info' && /^as\s*\d+$/i.test(sanitized)) {
            const match = sanitized.match(/^as\s*(\d+)$/i);
            if (match) sanitized = `AS${match[1]}`;
        }

        if (type === 'ping' || type === 'dns' || type === 'tcp' || type === 'udp') {
            sanitized = sanitized.replace(/^https?:\/\//, '');
            sanitized = sanitized.split('/')[0];
        }
        if (!sanitized) return;

        handleCheckStart(type, {}, (nodes) => {
            switch (type) {
                case 'ping': setPingNodes(nodes); break;
                case 'http': setHttpNodes(nodes); break;
                case 'tcp': setTcpNodes(nodes); break;
                case 'udp': setUdpNodes(nodes); break;
                case 'dns': setDnsNodes(nodes); break;
                case 'dns-all': setDnsInfoNodes(nodes); break;
                case 'mtr': setMtrNodes(nodes); break;
            }
        }, (results) => {
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
        });

        if (type === 'info') {
            setIpInfoResult(null);
            fetch(`/api/ip-info?host=${encodeURIComponent(sanitized)}${refresh ? '&refresh=true' : ''}`)
                .then(res => res.json())
                .then(data => setIpInfoResult(data))
                .catch(() => setErrorMessage("Failed to check IP Info."))
                .finally(() => handleCheckComplete('info'));
            return;
        }

        if (type === 'dns-all') {
            checkHostAPI.performDnsLookup(sanitized, refresh)
                .then(dnsData => {
                    const fakeNodeId = 'dns-lookup';
                    setDnsInfoNodes({ [fakeNodeId]: ['', '', 'Server DNS'] });
                    setDnsInfoResults({ [fakeNodeId]: dnsData });
                    handleCheckComplete('dns-all');
                })
                .catch(err => {
                    setErrorMessage(err.message || "Failed to perform DNS lookup.");
                    handleCheckComplete('dns-all');
                });
            return;
        }

        if (type === 'ssl') {
            handleCheckStart('ssl', {}, () => { }, () => setSslResults(null));
            fetch(`/api/ssl-check?host=${encodeURIComponent(sanitized)}`)
                .then(res => res.json())
                .then(data => {
                    setSslResults(data);
                    handleCheckComplete('ssl');
                })
                .catch(err => {
                    setErrorMessage(err.message || "Failed to perform SSL check.");
                    handleCheckComplete('ssl');
                });
            return;
        }

        checkHostAPI.performCheck(type, sanitized, { maxNodes, nodes: selectedNodeIds.length > 0 ? selectedNodeIds : undefined },
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
        ).finally(() => handleCheckComplete(type));
    };

    const handleCheckAll = () => {
        if (!host.trim()) return;
        const checkTypes: CheckType[] = ['info', 'ping', 'http', 'tcp', 'udp', 'dns', 'dns-all', 'ssl'];
        setActiveChecks(new Set(checkTypes));
        setCompletedChecks(new Set());
        checkTypes.forEach(type => runCheck(type, host));
    };

    const handleTabCheck = (type: CheckType) => {
        const manualTypes = ['ping', 'http', 'tcp', 'udp', 'dns', 'mtr'];
        if (manualTypes.includes(type)) return;
        if (!host.trim()) return;
        setPendingCheck({ type, host });
    };

    useEffect(() => {
        fetch('/api/admin/settings?key=feature_flags').then(res => res.json()).then(data => {
            if (data?.globalCheckEnabled) setGlobalCheckEnabled(true);
        });
    }, []);

    useEffect(() => {
        if (pendingCheck && activeTab === pendingCheck.type) {
            runCheck(pendingCheck.type, pendingCheck.host);
            setPendingCheck(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, pendingCheck]);

    const handlePingIp = (ip: string) => {
        setHost(ip);
        setIpInfoResult(null);
        setActiveTab("info");
        setTimeout(() => runCheck('info', ip), 100);
    };

    return (
        <div className="relative overflow-hidden">
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-100 hidden dark:block">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
            </div>

            <div className="relative z-10 flex flex-col">
                <div className="w-full pt-8 pb-2">
                    <div className="w-full">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full relative">
                            <div className="flex flex-col items-center justify-center gap-3 mb-4">
                                <div className="w-full max-w-sm lg:hidden mx-auto mb-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="w-full h-12 px-5 flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-white/10 rounded-2xl shadow-sm hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all font-medium text-slate-900 dark:text-slate-100 group">
                                                <div className="text-indigo-500 transition-transform group-hover:scale-110">
                                                    {getTabIcon(activeTab)}
                                                </div>
                                                <span className="text-base">{activeTab === 'dns-all' ? 'DNS INFO' : activeTab.toUpperCase()}</span>
                                                <ChevronDown className="h-5 w-5 text-slate-400 ml-auto group-hover:text-indigo-500 transition-colors" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 p-4 rounded-2xl shadow-xl border-slate-200 dark:border-white/10" align="center">
                                            <div className="grid grid-cols-3 gap-2">
                                                {['info', 'ping', 'http', 'tcp', 'udp', 'dns', 'mtr', 'dns-all', 'ssl'].map(t => (
                                                    <button key={t} onClick={() => { setActiveTab(t); handleTabCheck(t as any); }} className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${activeTab === t ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20 shadow-sm' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                                        <div className={cn("p-2 rounded-lg transition-transform duration-300 relative", activeTab === t ? "bg-white dark:bg-slate-800 scale-110 shadow-sm" : "bg-slate-50 dark:bg-slate-900/50")}>
                                                            {getTabIcon(t)}
                                                            {activeChecks.has(t as any) && <Loader2 className="h-3 w-3 animate-spin absolute -top-1 -right-1 text-indigo-500 bg-white dark:bg-slate-800 rounded-full" />}
                                                            {completedChecks.has(t as any) && <CheckCircle2 className="h-3 w-3 absolute -top-1 -right-1 text-emerald-500 bg-white dark:bg-slate-800 rounded-full" />}
                                                        </div>
                                                        <span className="text-xs font-medium">{t === 'dns-all' ? 'DNS Info' : t.toUpperCase()}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <TabsList className="hidden lg:flex w-auto h-12 p-1 bg-slate-100/80 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/5 items-center gap-0.5 shadow-sm">
                                    {['info', 'ping', 'http', 'tcp', 'udp', 'dns', 'mtr', 'dns-all', 'ssl'].map(t => (
                                        <TabsTrigger key={t} value={t} className="gap-1.5 px-3 relative data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-md data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 transition-all duration-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-xl group" onClick={() => handleTabCheck(t as any)}>
                                            <div className={cn("transition-transform duration-300", activeTab === t ? "scale-110 text-indigo-600 dark:text-indigo-400" : "opacity-50 group-hover:opacity-100 group-hover:text-slate-700 dark:group-hover:text-slate-300 text-slate-500 dark:text-slate-400")}>
                                                {getTabIcon(t)}
                                            </div>
                                            <span className="font-medium text-sm tracking-widest uppercase">{t === 'dns-all' ? 'DNS Info' : t}</span>
                                            {activeChecks.has(t as any) && <Loader2 className="h-3.5 w-3.5 animate-spin absolute -top-1.5 -right-1 text-indigo-500 bg-white dark:bg-slate-800 rounded-full shadow-sm" />}
                                            {completedChecks.has(t as any) && <CheckCircle2 className="h-3.5 w-3.5 absolute -top-1.5 -right-1 text-emerald-500 bg-white dark:bg-slate-800 rounded-full shadow-sm" />}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>

                                {globalCheckEnabled && (
                                    <Button variant="outline" size="sm" className="h-12 px-6 bg-white dark:bg-slate-900 rounded-xl hidden md:flex items-center gap-2 group" onClick={handleCheckAll} disabled={!host.trim()}>
                                        <Activity className="h-4 w-4 text-slate-400 group-hover:text-indigo-500" />
                                        <span className="font-medium text-sm uppercase tracking-wider">Global Check</span>
                                    </Button>
                                )}
                            </div>

                            <div className="mt-0">
                                <TabsContent value="info">
                                    <CheckForm type="info" host={host} maxNodes={maxNodes} onMaxNodesChange={setMaxNodes} onHostChange={setHost} onResults={() => { }} onCheckStart={() => { }} onCheckComplete={() => host.trim() && runCheck('info', host)} errorMessage={errorMessage} isLoading={activeChecks.has('info')} nodes={nodes} isReverseMtr={isReverseMtr} onReverseMtrToggle={handleReverseMtrToggle} selectedNodeIds={selectedNodeIds} showQuickLinks />
                                    {ipInfoResult && <IpInfoResult data={ipInfoResult} onRefresh={() => runCheck('info', host, true)} isRefreshing={activeChecks.has('info')} />}
                                </TabsContent>

                                <TabsContent value="ping">
                                    <CheckForm type="ping" host={host} maxNodes={maxNodes} onMaxNodesChange={setMaxNodes} onHostChange={setHost} onResults={handlePingResults} onProgress={(results) => setPingResults(results)} onCheckStart={(checkNodes) => handleCheckStart('ping', checkNodes, setPingNodes, setPingResults)} onCheckComplete={() => handleCheckComplete('ping')} errorMessage={errorMessage} isLoading={activeChecks.has('ping')} nodes={nodes} isReverseMtr={isReverseMtr} onReverseMtrToggle={handleReverseMtrToggle} selectedNodeIds={selectedNodeIds} selectedNodeCount={selectedNodeIds.length} onToggleMap={() => setShowMap(!showMap)} onClearSelection={clearSelectedNodes} isMapVisible={showMap} autoStart={autoStart && activeTab === 'ping'} />
                                    {showMap && <div className="mt-4"><NodalMap nodes={nodes} selectedNodeIds={selectedNodeIds} onToggleNode={toggleNode} activeNodeIds={activeChecks.has('ping') ? Object.keys(pingNodes) : []} /></div>}
                                    <ResultsDisplay results={pingResults || {}} checkType="ping" nodes={nodes} activeNodes={pingNodes} targetHost={host} isLoading={activeChecks.has('ping')} />
                                </TabsContent>

                                <TabsContent value="http">
                                    <CheckForm type="http" host={host} maxNodes={maxNodes} onMaxNodesChange={setMaxNodes} onHostChange={setHost} onResults={handleHttpResults} onProgress={(results) => setHttpResults(results)} onCheckStart={(checkNodes) => handleCheckStart('http', checkNodes, setHttpNodes, setHttpResults)} onCheckComplete={() => handleCheckComplete('http')} errorMessage={errorMessage} isLoading={activeChecks.has('http')} nodes={nodes} isReverseMtr={isReverseMtr} onReverseMtrToggle={handleReverseMtrToggle} selectedNodeIds={selectedNodeIds} selectedNodeCount={selectedNodeIds.length} onToggleMap={() => setShowMap(!showMap)} onClearSelection={clearSelectedNodes} isMapVisible={showMap} autoStart={autoStart && activeTab === 'http'} />
                                    {showMap && <div className="mt-4"><NodalMap nodes={nodes} selectedNodeIds={selectedNodeIds} onToggleNode={toggleNode} activeNodeIds={activeChecks.has('http') ? Object.keys(httpNodes) : []} /></div>}
                                    <ResultsDisplay results={httpResults || {}} checkType="http" nodes={nodes} activeNodes={httpNodes} targetHost={host} isLoading={activeChecks.has('http')} />
                                </TabsContent>

                                <TabsContent value="tcp">
                                    <CheckForm type="tcp" host={host} maxNodes={maxNodes} onMaxNodesChange={setMaxNodes} onHostChange={setHost} onResults={handleTcpResults} onProgress={(results) => setTcpResults(results)} onCheckStart={(checkNodes) => handleCheckStart('tcp', checkNodes, setTcpNodes, setTcpResults)} onCheckComplete={() => handleCheckComplete('tcp')} errorMessage={errorMessage} isLoading={activeChecks.has('tcp')} nodes={nodes} isReverseMtr={isReverseMtr} onReverseMtrToggle={handleReverseMtrToggle} selectedNodeIds={selectedNodeIds} selectedNodeCount={selectedNodeIds.length} onToggleMap={() => setShowMap(!showMap)} onClearSelection={clearSelectedNodes} isMapVisible={showMap} autoStart={autoStart && activeTab === 'tcp'} />
                                    {showMap && <div className="mt-4"><NodalMap nodes={nodes} selectedNodeIds={selectedNodeIds} onToggleNode={toggleNode} activeNodeIds={activeChecks.has('tcp') ? Object.keys(tcpNodes) : []} /></div>}
                                    <ResultsDisplay results={tcpResults || {}} checkType="tcp" nodes={nodes} activeNodes={tcpNodes} targetHost={host} isLoading={activeChecks.has('tcp')} />
                                </TabsContent>

                                <TabsContent value="udp">
                                    <CheckForm type="udp" host={host} maxNodes={maxNodes} onMaxNodesChange={setMaxNodes} onHostChange={setHost} onResults={handleUdpResults} onProgress={(results) => setUdpResults(results)} onCheckStart={(checkNodes) => handleCheckStart('udp', checkNodes, setUdpNodes, setUdpResults)} onCheckComplete={() => handleCheckComplete('udp')} errorMessage={errorMessage} isLoading={activeChecks.has('udp')} nodes={nodes} isReverseMtr={isReverseMtr} onReverseMtrToggle={handleReverseMtrToggle} selectedNodeIds={selectedNodeIds} selectedNodeCount={selectedNodeIds.length} onToggleMap={() => setShowMap(!showMap)} onClearSelection={clearSelectedNodes} isMapVisible={showMap} autoStart={autoStart && activeTab === 'udp'} />
                                    {showMap && <div className="mt-4"><NodalMap nodes={nodes} selectedNodeIds={selectedNodeIds} onToggleNode={toggleNode} activeNodeIds={activeChecks.has('udp') ? Object.keys(udpNodes) : []} /></div>}
                                    <ResultsDisplay results={udpResults || {}} checkType="udp" nodes={nodes} activeNodes={udpNodes} targetHost={host} isLoading={activeChecks.has('udp')} />
                                </TabsContent>

                                <TabsContent value="dns">
                                    <CheckForm type="dns" host={host} maxNodes={maxNodes} onMaxNodesChange={setMaxNodes} onHostChange={setHost} onResults={handleDnsResults} onProgress={(results) => setDnsResults(results)} onCheckStart={(checkNodes) => handleCheckStart('dns', checkNodes, setDnsNodes, setDnsResults)} onCheckComplete={() => handleCheckComplete('dns')} errorMessage={errorMessage} isLoading={activeChecks.has('dns')} nodes={nodes} isReverseMtr={isReverseMtr} onReverseMtrToggle={handleReverseMtrToggle} selectedNodeIds={selectedNodeIds} selectedNodeCount={selectedNodeIds.length} onToggleMap={() => setShowMap(!showMap)} onClearSelection={clearSelectedNodes} isMapVisible={showMap} dnsType={dnsType} onDnsTypeChange={setDnsType} autoStart={autoStart && activeTab === 'dns'} />
                                    {showMap && <div className="mt-4"><NodalMap nodes={nodes} selectedNodeIds={selectedNodeIds} onToggleNode={toggleNode} activeNodeIds={activeChecks.has('dns') ? Object.keys(dnsNodes) : []} /></div>}
                                    <ResultsDisplay results={dnsResults || {}} checkType="dns" nodes={nodes} activeNodes={dnsNodes} targetHost={host} isLoading={activeChecks.has('dns')} dnsType={dnsType} onDnsTypeChange={setDnsType} />
                                </TabsContent>

                                <TabsContent value="mtr">
                                    <CheckForm type="mtr" host={host} maxNodes={maxNodes} onMaxNodesChange={setMaxNodes} onHostChange={setHost} onResults={handleMtrResults} onProgress={(results) => setMtrResults(results)} onCheckStart={(checkNodes) => handleCheckStart('mtr', checkNodes, setMtrNodes, setMtrResults)} onCheckComplete={() => handleCheckComplete('mtr')} errorMessage={errorMessage} isLoading={activeChecks.has('mtr')} nodes={nodes} isReverseMtr={isReverseMtr} onReverseMtrToggle={handleReverseMtrToggle} selectedNodeIds={selectedNodeIds} selectedNodeCount={selectedNodeIds.length} onToggleMap={() => setShowMap(!showMap)} onClearSelection={clearSelectedNodes} isMapVisible={showMap} autoStart={autoStart && activeTab === 'mtr'} />
                                    {showMap && <div className="mt-4"><NodalMap nodes={nodes} selectedNodeIds={selectedNodeIds} onToggleNode={toggleNode} activeNodeIds={activeChecks.has('mtr') ? Object.keys(mtrNodes) : []} /></div>}
                                    <ResultsDisplay results={mtrResults || {}} checkType="mtr" nodes={nodes} activeNodes={mtrNodes} targetHost={host} isLoading={activeChecks.has('mtr')} onPingIp={handlePingIp} />
                                </TabsContent>

                                <TabsContent value="dns-all">
                                    <CheckForm type="dns-all" host={host} maxNodes={maxNodes} onMaxNodesChange={setMaxNodes} onHostChange={setHost} onResults={handleDnsInfoResults} onCheckStart={(checkNodes) => handleCheckStart('dns-all', checkNodes, setDnsInfoNodes, setDnsInfoResults)} onCheckComplete={() => handleCheckComplete('dns-all')} errorMessage={errorMessage} isLoading={activeChecks.has('dns-all')} nodes={nodes} isReverseMtr={isReverseMtr} onReverseMtrToggle={handleReverseMtrToggle} selectedNodeIds={selectedNodeIds} autoStart={autoStart && activeTab === 'dns-all'} />
                                    <ResultsDisplay results={dnsInfoResults || {}} checkType="dns-all" nodes={nodes} activeNodes={dnsInfoNodes} targetHost={host} isLoading={activeChecks.has('dns-all')} dnsType={dnsType} onDnsTypeChange={setDnsType} onRefresh={() => runCheck('dns-all', host, true)} isRefreshing={activeChecks.has('dns-all')} />
                                </TabsContent>

                                <TabsContent value="ssl">
                                    <CheckForm type="ssl" host={host} maxNodes={maxNodes} onMaxNodesChange={setMaxNodes} onHostChange={setHost} onResults={() => { }} onCheckStart={() => { }} onCheckComplete={() => host.trim() && runCheck('ssl', host)} errorMessage={errorMessage} isLoading={activeChecks.has('ssl')} nodes={nodes} isReverseMtr={isReverseMtr} onReverseMtrToggle={handleReverseMtrToggle} selectedNodeIds={selectedNodeIds} autoStart={autoStart && activeTab === 'ssl'} />
                                    {sslResults && <SslDashboard data={sslResults} host={host} />}
                                </TabsContent>
                            </div>
                        </Tabs>
                        <AdSlot slotType="results_bottom" className="mt-4" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ChecksClient({ initialHost, initialTab, autoStart }: { initialHost?: string, initialTab?: string, autoStart?: boolean } = {}) {
    return (
        <Suspense fallback={<div className="h-[400px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <ChecksPageContent initialHost={initialHost} initialTab={initialTab} autoStart={autoStart} />
        </Suspense>
    );
}
