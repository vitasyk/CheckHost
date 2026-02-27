import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DnsContentEn() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Global DNS Propagation & Record Lookup
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">How Does a DNS Check Work?</h2>
                        <p>
                            The Domain Name System (DNS) is often referred to as the &quot;phonebook of the internet.&quot; It translates human-readable domain names (like c{process.env.NEXT_PUBLIC_SITE_NAME || 'CheckHost'}) into IP addresses that computers use to identify each other on the network. A DNS Check queries specific nameservers to retrieve the current DNS records associated with a domain.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Common DNS Record Types</h2>
                        <p>
                            Understanding the different types of DNS records is essential for website administrators and IT professionals:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>A Record:</strong> Maps a domain name to an IPv4 address. This is the most common record type.</li>
                            <li><strong>AAAA Record:</strong> Maps a domain name to an IPv6 address, the newer generation of IP addresses.</li>
                            <li><strong>MX Record:</strong> Mail Exchange records direct email to a mail server. Crucial for ensuring email delivery.</li>
                            <li><strong>CNAME Record:</strong> Canonical Name records map an alias name to a true or &quot;canonical&quot; domain name.</li>
                            <li><strong>TXT Record:</strong> Text records hold arbitrary text. They are frequently used to verify domain ownership and for email security policies like SPF, DKIM, and DMARC.</li>
                            <li><strong>NS Record:</strong> Name Server records delegate a domain to a set of authoritative name servers.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">What is DNS Propagation?</h2>
                        <p>
                            When you make changes to your DNS records (e.g., changing your hosting provider or updating an MX record), those changes don&apos;t take effect immediately across the entire internet. The time it takes for these updates to spread to ISP caches worldwide is called <strong>DNS propagation</strong>. This process can take anywhere from a few minutes to up to 48 hours, depending on the Time to Live (TTL) settings of your previous records. Our global DNS tool helps you verify the propagation status from multiple geographical locations in real-time.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
