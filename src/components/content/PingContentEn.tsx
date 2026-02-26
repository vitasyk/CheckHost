import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PingContentEn() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        What is a Ping Test and How Does It Work?
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Understanding the Ping Command</h2>
                        <p>
                            A Ping test is an essential network diagnostic tool utilized to test the reachability of a host (like a website, server, or IP address) on an Internet Protocol (IP) network. It operates by sending Internet Control Message Protocol (ICMP) Echo Request packets to the target destination and waiting for an ICMP Echo Reply.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Why Measure Network Latency?</h2>
                        <p>
                            The time it takes for these packets to travel from the source to the destination and back is known as <strong>latency</strong> or round-trip time (RTT), usually measured in milliseconds (ms). High latency can result in slow website loading times, lagging in online gaming, and poor audio/video quality in VoIP applications.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>Fast Response (0-50ms):</strong> Excellent connection, ideal for real-time applications.</li>
                            <li><strong>Acceptable Response (50-150ms):</strong> Good connection, suitable for general web browsing and streaming.</li>
                            <li><strong>Slow Response (&gt;150ms):</strong> Noticeable delay, which may impact interactive applications.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">The Importance of Global Ping Testing</h2>
                        <p>
                            Testing connectivity from a single location only shows part of the picture. A website might perform perfectly for users in New York but suffer from significant packet loss for users in Tokyo. By utilizing a global ping tool like CheckHost, you can verify routing efficiency and identify regional network outages across different continents simultaneously. This is particularly crucial for businesses utilizing Content Delivery Networks (CDNs) to ensure global availability.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
