import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PingContentNl() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Wat is een Ping-test en hoe werkt het?
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">De Ping-opdracht begrijpen</h2>
                        <p>
                            Een Ping-test is een essentieel diagnostisch netwerkhulpmiddel dat wordt gebruikt om de bereikbaarheid van een host (zoals een website, server of IP-adres) in een IP-netwerk te testen. Het stuurt ICMP Echo Request-pakketten naar de bestemming en wacht op een antwoord.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Waarom netwerklatentie meten?</h2>
                        <p>
                            De tijd die deze pakketten nodig hebben om van bron naar bestemming en terug te reizen, staat bekend als <strong>latentie</strong> of RTT. Hoge latentie leidt tot trage laadtijden en vertraging in toepassingen.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>Snelle reactie (0-50ms):</strong> Uitstekende verbinding.</li>
                            <li><strong>Acceptabele reactie (50-150ms):</strong> Goede verbinding.</li>
                            <li><strong>Trage reactie (&gt;150ms):</strong> Merkbare vertraging.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Het belang van wereldwijde Ping-tests</h2>
                        <p>
                            Netwerkconnectiviteit testen vanaf slechts één locatie toont slechts een deel van het beeld. Een website kan goed presteren voor gebruikers in New York, maar enorme pakketverliezen ervaren in Tokio. CheckHost helpt deze regionale problemen wereldwijd te identificeren.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
