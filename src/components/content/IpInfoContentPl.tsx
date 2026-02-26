import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function IpInfoContentPl() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Głęboka geolokalizacja IP i analiza sieciowa
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Czym jest adres IP?</h2>
                        <p>
                            Adres IP to unikalna etykieta numeryczna przypisana do każdego urządzenia w sieci. Służy do identyfikacji interfejsu i adresowania lokalizacji.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Dostawcy geolokalizacji IP</h2>
                        <p>
                            Nasze narzędzie odpytuje jednocześnie wiele wiodących baz danych:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>MaxMind:</strong> Znany z wysokiej dokładności baz GeoIP.</li>
                            <li><strong>IPinfo.io:</strong> Specjalizuje się w szczegółach ASN i danych o firmach.</li>
                            <li><strong>DB-IP i IP2Location:</strong> Dostarczają alternatywnych danych mapowania i analizy ISP.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">ASNy i routing</h2>
                        <p>
                            <strong>System Autonomiczny (AS)</strong> to duża sieć z jednolitą polityką routingu. Każdy AS posiada unikalny numer (<strong>ASN</strong>).
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Sieci Anycast vs. Unicast</h2>
                        <p>
                            W sieci Anycast ten sam adres IP jest rozgłaszany z wielu lokalizacji. Ruch jest automatycznie kierowany do najbliższego węzła.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
