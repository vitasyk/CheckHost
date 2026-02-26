import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function IpInfoContentDe() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Tiefe IP-Geolokalisierung & Netzwerk-Intelligenz
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Was ist eine IP-Adresse?</h2>
                        <p>
                            Eine IP-Adresse ist ein eindeutiges numerisches Label für jedes mit dem Internet verbundene Gerät. Sie dient der Identifikation und Standortbestimmung im Netzwerk.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">IP-Geolokalisierungsanbieter verstehen</h2>
                        <p>
                            Unser Tool fragt mehrere branchenführende Datenbanken gleichzeitig ab, um die genauesten Ergebnisse zu liefern:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>MaxMind:</strong> Bekannt für hochpräzise GeoIP-Datenbanken.</li>
                            <li><strong>IPinfo.io:</strong> Spezialisiert auf ASN-Details und Unternehmensinformationen.</li>
                            <li><strong>DB-IP & IP2Location:</strong> Bieten alternative Mapping-Daten und ISP-Details.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">ASN und Routing</h2>
                        <p>
                            Ein <strong>Autonomous System (AS)</strong> ist ein großes Netzwerk mit einer einheitlichen Routing-Richtlinie. Jedes AS hat eine weltweit eindeutige <strong>ASN</strong>. Dies hilft zu verstehen, wem ein IP-Block gehört.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Anycast vs. Unicast Netzwerke</h2>
                        <p>
                            Bei Anycast wird dieselbe IP von mehreren Standorten weltweit ausgestrahlt. Router leiten den Verkehr automatisch zum nächstgelegenen Knoten, was die Latenz verringert.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
