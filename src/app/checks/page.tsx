'use client';

import { useState, useEffect } from 'react';
import type { ResultsResponse, CheckType, Node } from '@/types/checkhost';
import { checkHostAPI } from '@/lib/checkhost-api';
import { CheckForm } from '@/components/checks/CheckForm';
import { ResultsDisplay } from '@/components/checks/ResultsDisplay';
import { Header } from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Activity, Wifi, Database, Network, Loader2, CheckCircle2, Info } from 'lucide-react';
import { IpInfoResponse } from '@/types/ip-info';
import IpInfoResult from '@/components/ip-info/IpInfoResult';
import { AdSlot } from '@/components/AdSlot';

const tabs: CheckType[] = ['info', 'ping', 'http', 'tcp', 'udp', 'dns', 'mtr'];

export default function ChecksPage() {
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

    const [mtrResults, setMtrResults] = useState<ResultsResponse | null>(null);
    const [mtrNodes, setMtrNodes] = useState<Record<string, any>>({});

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

    const handleMtrResults = (results: ResultsResponse, checkNodes: Record<string, any>) => {
        setMtrResults(results);
        setMtrNodes(checkNodes);
    };

    const [host, setHost] = useState('');
    const [maxNodes, setMaxNodes] = useState(20);
    const [activeChecks, setActiveChecks] = useState<Set<CheckType>>(new Set());
    const [completedChecks, setCompletedChecks] = useState<Set<CheckType>>(new Set());
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

    const runCheck = (type: CheckType, currentHost: string) => {
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
                    case 'mtr': setMtrNodes(nodes); break;
                }
            },
            (results) => {
                switch (type) {
                    case 'ping': setPingResults(results); break;
                    case 'http': setHttpResults(results); break;
                    case 'tcp': setTcpResults(results); break;
                    case 'udp': setUdpResults(results); break;
                    case 'dns': setDnsResults(results); break;
                    case 'mtr': setMtrResults(results); break;
                }
            }
        );

        if (type === 'info') {
            setIpInfoResult(null);
            fetch(`/api/ip-info?host=${encodeURIComponent(sanitized)}`)
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

        console.log(`Starting check for ${type} on ${sanitized}`);

        checkHostAPI.performCheck(
            type,
            sanitized,
            { maxNodes },
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

        const checkTypes: CheckType[] = ['info', 'ping', 'http', 'tcp', 'udp', 'dns'];

        // Mark all as active immediately and clear completed
        setActiveChecks(new Set(checkTypes));
        setCompletedChecks(new Set());

        // Reset results to trigger UI loading
        setPingResults({});
        setHttpResults({});
        setTcpResults({});
        setUdpResults({});
        setDnsResults({});

        checkTypes.forEach(type => {
            runCheck(type, host);
        });
    };

    const handleTabCheck = (type: CheckType) => {
        if (!host.trim()) {
            setErrorMessage('Please enter a domain or IP to start check');
            return;
        }
        setErrorMessage(null);
        // Defer check until tab is fully active
        setPendingCheck({ type, host });
    };

    const onHostChange = (newHost: string) => {
        setHost(newHost);
        if (newHost.trim()) {
            setErrorMessage(null);
        }
    };

    const [activeTab, setActiveTab] = useState<string>("info");
    const [pendingCheck, setPendingCheck] = useState<{ type: CheckType, host: string } | null>(null);

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
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-4">
                                <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 lg:w-auto lg:inline-flex h-12 p-1 bg-slate-200/40 dark:bg-slate-900/60 rounded-xl border border-slate-200/50 dark:border-white/5">
                                    <TabsTrigger value="info" className="gap-2 relative data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all duration-200" onClick={() => handleTabCheck('info')}>
                                        <Info className="h-4 w-4" />
                                        <span>Info</span>
                                        {activeChecks.has('info') ? (
                                            <Loader2 className="h-3 w-3 animate-spin absolute -top-1 -right-1 text-primary" />
                                        ) : completedChecks.has('info') ? (
                                            <CheckCircle2 className="h-3 w-3 absolute -top-1 -right-1 text-green-500" />
                                        ) : null}
                                    </TabsTrigger>
                                    <TabsTrigger value="ping" className="gap-2 relative data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all duration-200" onClick={() => handleTabCheck('ping')}>
                                        <Wifi className="h-4 w-4" />
                                        <span>Ping</span>
                                        {activeChecks.has('ping') ? (
                                            <Loader2 className="h-3 w-3 animate-spin absolute -top-1 -right-1 text-primary" />
                                        ) : completedChecks.has('ping') ? (
                                            <CheckCircle2 className="h-3 w-3 absolute -top-1 -right-1 text-green-500" />
                                        ) : null}
                                    </TabsTrigger>
                                    <TabsTrigger value="http" className="gap-2 relative data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all duration-200" onClick={() => handleTabCheck('http')}>
                                        <Activity className="h-4 w-4" />
                                        <span>HTTP</span>
                                        {activeChecks.has('http') ? (
                                            <Loader2 className="h-3 w-3 animate-spin absolute -top-1 -right-1 text-primary" />
                                        ) : completedChecks.has('http') ? (
                                            <CheckCircle2 className="h-3 w-3 absolute -top-1 -right-1 text-green-500" />
                                        ) : null}
                                    </TabsTrigger>
                                    <TabsTrigger value="tcp" className="gap-2 relative data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all duration-200" onClick={() => handleTabCheck('tcp')}>
                                        <Network className="h-4 w-4" />
                                        <span>TCP</span>
                                        {activeChecks.has('tcp') ? (
                                            <Loader2 className="h-3 w-3 animate-spin absolute -top-1 -right-1 text-primary" />
                                        ) : completedChecks.has('tcp') ? (
                                            <CheckCircle2 className="h-3 w-3 absolute -top-1 -right-1 text-green-500" />
                                        ) : null}
                                    </TabsTrigger>
                                    <TabsTrigger value="udp" className="gap-2 relative data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all duration-200" onClick={() => handleTabCheck('udp')}>
                                        <Database className="h-4 w-4" />
                                        <span>UDP</span>
                                        {activeChecks.has('udp') ? (
                                            <Loader2 className="h-3 w-3 animate-spin absolute -top-1 -right-1 text-primary" />
                                        ) : completedChecks.has('udp') ? (
                                            <CheckCircle2 className="h-3 w-3 absolute -top-1 -right-1 text-green-500" />
                                        ) : null}
                                    </TabsTrigger>
                                    <TabsTrigger value="dns" className="gap-2 relative data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all duration-200" onClick={() => handleTabCheck('dns')}>
                                        <Activity className="h-4 w-4" />
                                        <span>DNS</span>
                                        {activeChecks.has('dns') ? (
                                            <Loader2 className="h-3 w-3 animate-spin absolute -top-1 -right-1 text-primary" />
                                        ) : completedChecks.has('dns') ? (
                                            <CheckCircle2 className="h-3 w-3 absolute -top-1 -right-1 text-green-500" />
                                        ) : null}
                                    </TabsTrigger>
                                    <TabsTrigger value="mtr" className="gap-2 relative data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all duration-200" onClick={() => handleTabCheck('mtr')}>
                                        <Activity className="h-4 w-4" />
                                        <span>MTR</span>
                                        {activeChecks.has('mtr') ? (
                                            <Loader2 className="h-3 w-3 animate-spin absolute -top-1 -right-1 text-primary" />
                                        ) : completedChecks.has('mtr') ? (
                                            <CheckCircle2 className="h-3 w-3 absolute -top-1 -right-1 text-green-500" />
                                        ) : null}
                                    </TabsTrigger>
                                </TabsList>

                                <Button
                                    variant="outline"
                                    className="group h-12 gap-3 px-6 bg-white dark:bg-slate-900 border-slate-200/60 dark:border-white/5 text-slate-900 dark:text-slate-100 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300 rounded-xl whitespace-nowrap"
                                    onClick={handleCheckAll}
                                    disabled={!host.trim()}
                                >
                                    <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                    <span className="font-bold">Check All</span>
                                </Button>
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
                                        />
                                        {activeChecks.has('info') ? (
                                            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground animate-pulse gap-4">
                                                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                                                <span>Obtaining global IP intelligence...</span>
                                            </div>
                                        ) : ipInfoResult ? (
                                            <IpInfoResult data={ipInfoResult} />
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
                                        />
                                        {(pingResults || Object.keys(pingNodes).length > 0) && (
                                            <ResultsDisplay results={pingResults || {}} checkType="ping" nodes={nodes} activeNodes={pingNodes} />
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
                                        />
                                        {(httpResults || Object.keys(httpNodes).length > 0) && (
                                            <ResultsDisplay results={httpResults || {}} checkType="http" nodes={nodes} activeNodes={httpNodes} />
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
                                        />
                                        {(tcpResults || Object.keys(tcpNodes).length > 0) && (
                                            <ResultsDisplay results={tcpResults || {}} checkType="tcp" nodes={nodes} activeNodes={tcpNodes} />
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
                                        />
                                        {(udpResults || Object.keys(udpNodes).length > 0) && (
                                            <ResultsDisplay results={udpResults || {}} checkType="udp" nodes={nodes} activeNodes={udpNodes} />
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
                                        />
                                        {(dnsResults || Object.keys(dnsNodes).length > 0) && (
                                            <ResultsDisplay results={dnsResults || {}} checkType="dns" nodes={nodes} activeNodes={dnsNodes} />
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
                                        />
                                        {(mtrResults || Object.keys(mtrNodes).length > 0) && (
                                            <ResultsDisplay
                                                results={mtrResults || {}}
                                                checkType="mtr"
                                                nodes={nodes}
                                                activeNodes={mtrNodes}
                                                onPingIp={handlePingIp}
                                            />
                                        )}
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
            </div>
        </div>
    );
}
