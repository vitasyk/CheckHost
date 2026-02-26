import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DnsContentNl() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Wereldwijde DNS-propagatien en Record Lookup
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Hoe werkt een DNS-controle?</h2>
                        <p>
                            Het Domain Name System (DNS) vertaalt domeinnamen naar IP-adressen. Een DNS-controle vraagt specifieke nameservers af om de huidige DNS-records op te halen.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Veelvoorkomende DNS-recordtypen</h2>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>A Record:</strong> Verwijst naar een IPv4-adres.</li>
                            <li><strong>AAAA Record:</strong> Verwijijst naar een IPv6-adres.</li>
                            <li><strong>MX Record:</strong> Verwijst e-mail naar een mailserver.</li>
                            <li><strong>CNAME Record:</strong> Koppel een alias aan een canonical domeinnaam.</li>
                            <li><strong>TXT Record:</strong> Gebruikt voor verificaties zoals SPF, DKIM en DMARC.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Wat is DNS-propagatie?</h2>
                        <p>
                            De tijd die het duurt voordat DNS-wijzigingen overal op het internet zichtbaar zijn, wordt <strong>DNS-propagatie</strong> genoemd.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
