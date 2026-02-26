import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function IpInfoContentFr() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Géolocalisation IP approfondie et Intelligence réseau
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Qu&apos;est-ce qu&apos;une adresse IP?</h2>
                        <p>
                            Une adresse IP est une étiquette numérique unique assignée à chaque appareil connecté à un réseau informatique. Elle sert à l&apos;identification de l&apos;interface réseau et à l&apos;adressage de localisation.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Fournisseurs de géolocalisation IP</h2>
                        <p>
                            Notre outil interroge simultanément plusieurs bases de données de premier plan :
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>MaxMind:</strong> Connu pour ses bases de données GeoIP haute précision.</li>
                            <li><strong>IPinfo.io:</strong> Spécialisé dans les détails ASN et les informations sur les entreprises.</li>
                            <li><strong>DB-IP & IP2Location:</strong> Fournissent des données cartographiques alternatives.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">ASN et Routage</h2>
                        <p>
                            Un <strong>Système Autonome (AS)</strong> est un grand réseau avec une politique de routage unifiée. Chaque AS possède un numéro unique (<strong>ASN</strong>).
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Réseaux Anycast vs Unicast</h2>
                        <p>
                            Dans un réseau Anycast, la même adresse IP est diffusée depuis plusieurs endroits dans le monde. Le trafic est automatiquement dirigé vers le nœud le plus proche.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
