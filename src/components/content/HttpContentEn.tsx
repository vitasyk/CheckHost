import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function HttpContentEn() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Comprehensive HTTP & Website Uptime Monitoring
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">What is an HTTP Status Check?</h2>
                        <p>
                            An HTTP check is a process that simulates a user attempting to visit a web page. Unlike a simple ICMP ping which only verifies if a server is online at the network layer, an HTTP check ensures that the web server software (like Apache, Nginx, or IIS) is actually responding with valid content at the application layer.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Understanding HTTP Status Codes</h2>
                        <p>
                            When our monitoring nodes request your website, they receive a standard HTTP status code indicating the health of the application. Understanding these codes is critical for webmasters:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>200 OK:</strong> The standard response for successful requests. The website is fully operational.</li>
                            <li><strong>301 / 302 Redirect:</strong> The requested resource has moved. While normal, excessive redirect chains can slow down your site.</li>
                            <li><strong>403 Forbidden / 404 Not Found:</strong> Client-side errors indicating missing pages or configuration issues.</li>
                            <li><strong>500 / 502 / 503 Server Errors:</strong> Critical infrastructure failures indicating that your web server, database, or proxy is currently down.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Why Global Uptime Monitoring Matters for SEO</h2>
                        <p>
                            Search engines like Google heavily prioritize user experience, which includes website availability and Time to First Byte (TTFB). If search engine bots encounter frequent 5xx errors or significant timeouts when crawling your site, your organic rankings will suffer. Utilizing a global HTTP monitoring tool helps you detect routing issues, verify SSL certificate validity, and ensure your site delivers consistent performance regardless of the user&apos;s geographical location.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
