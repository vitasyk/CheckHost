import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function IpInfoContentNl() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Diepe IP-geolocatie & Netwerkinlichtingen
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Wat is een IP-adres?</h2>
                        <p>
                            Een IP-adres is een uniek numeriek label dat wordt toegewezen aan elk apparaat dat is aangesloten op een computernetwerk. Het dient voor identificatie en locatiebepaling.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">IP-geolocatieproviders begrijpen</h2>
                        <p>
                            Onze tool raadpleegt meerdere toonaangevende databases tegelijkertijd voor de meest nauwkeurige resultaten:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>MaxMind:</strong> Bekend om GeoIP-databases van hoge kwaliteit.</li>
                            <li><strong>IPinfo.io:</strong> Gespecialiseerd in ASN-details en bedrijfsinformatie.</li>
                            <li><strong>DB-IP & IP2Location:</strong> Bieden alternatieve mappinggegevens en ISP-analyse.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">ASN en Routering</h2>
                        <p>
                            Een <strong>Autonomous System (AS)</strong> is een groot netwerk met een uniform routeringsbeleid. Elke AS heeft een uniek nummer (<strong>ASN</strong>).
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Anycast vs. Unicast-netwerken</h2>
                        <p>
                            In een Anycast-netwerk wordt hetzelfde IP-adres uitgezonden vanaf meerdere locaties wereldwijd. Verkeer wordt automatisch naar het dichtstbijzijnde knooppunt geleid.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
