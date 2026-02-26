import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function IpInfoContentIt() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Geolocalizzazione IP profonda e Network Intelligence
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Cos&apos;è un indirizzo IP?</h2>
                        <p>
                            Un indirizzo IP è un&apos;etichetta numerica unica assegnata a ogni dispositivo collegato a una rete. Serve per l&apos;identificazione dell&apos;interfaccia di rete e l&apos;indirizzamento della posizione.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Fornitori di geolocalizzazione IP</h2>
                        <p>
                            Il nostro strumento interroga simultaneamente diversi database leader del settore:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>MaxMind:</strong> Conosciuto per i suoi database GeoIP ad alta precisione.</li>
                            <li><strong>IPinfo.io:</strong> Specializzato in dettagli ASN e informazioni aziendali.</li>
                            <li><strong>DB-IP e IP2Location:</strong> Forniscono dati di mappatura alternativi e analisi degli ISP.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">ASN e Routing</h2>
                        <p>
                            Un <strong>Sistema Autonomo (AS)</strong> è un&apos;ampia rete con una politica di routing unificata. Ogni AS ha un numero unico (<strong>ASN</strong>).
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Reti Anycast vs Unicast</h2>
                        <p>
                            Nelle reti Anycast, lo stesso indirizzo IP viene trasmesso da più posizioni fisiche in tutto il mondo. Il traffico viene indirizzato automaticamente al nodo più vicino.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
