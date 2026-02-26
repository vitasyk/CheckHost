import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function IpInfoContentEn() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Deep IP Geolocation & Network Intelligence
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">What is an IP Address?</h2>
                        <p>
                            An Internet Protocol (IP) address is a unique numerical label assigned to every device connected to a computer network that uses the Internet Protocol for communication. It serves two principal functions: host or network interface identification and location addressing.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Understanding IP Geolocation Providers</h2>
                        <p>
                            IP Geolocation is the process of estimating the real-world geographic location of an internet-connected device using its IP address. However, different geolocation databases often provide varying results because mapping IP addresses to physical locations is an inexact science based on data from internet service providers, registries, and network routing.
                        </p>
                        <p className="mt-2">
                            Our tool queries multiple industry-leading databases simultaneously to provide the most accurate consensus:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>MaxMind:</strong> A prominent provider known for its high-accuracy GeoIP databases, widely used in enterprise fraud prevention.</li>
                            <li><strong>IPinfo.io:</strong> Specializes in providing deep logical data, including Anycast detection, ASN details, and company information.</li>
                            <li><strong>DB-IP & IP2Location:</strong> Provide alternative mapping data, often offering nuanced ISP details and connection type analysis (e.g., cellular vs. broadband).</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Autonomous System Numbers (ASN) and Routing</h2>
                        <p>
                            An <strong>Autonomous System (AS)</strong> is a large network or group of networks that has a unified routing policy, typically operated by a single large organization like an Internet Service Provider (ISP), a tech giant (like Google or Amazon), or a university. Every AS is assigned a globally unique <strong>Autonomous System Number (ASN)</strong>.
                        </p>
                        <p className="mt-2">
                            Identifying the ASN associated with an IP address helps security professionals and network engineers understand which organization owns the IP block and how traffic is being routed to it across the internet backbone.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Anycast vs. Unicast Networks</h2>
                        <p>
                            Modern content delivery networks (CDNs) often use <strong>Anycast</strong> routing. In a traditional Unicast network, one IP address corresponds to exactly one physical server in one location. In an Anycast network, the same IP address is broadcast from multiple physical locations worldwide. When you query an Anycast IP, routers automatically direct your traffic to the nearest reporting node. This significantly reduces latency and improves resilience against DDoS attacks.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
