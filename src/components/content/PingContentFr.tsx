import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PingContentFr() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Qu&apos;est-ce qu&apos;un test Ping et comment ça marche?
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Comprendre la commande Ping</h2>
                        <p>
                            Un test Ping est un outil de diagnostic réseau essentiel utilisé pour tester l&apos;accessibilité d&apos;un hôte (comme un site Web, un serveur ou une adresse IP) sur un réseau IP. Il fonctionne en envoyant des paquets de demande d&apos;écho ICMP à la destination et en attendant une réponse.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Pourquoi mesurer la latence du réseau?</h2>
                        <p>
                            Le temps nécessaire à ces paquets pour aller de la source à la destination et revenir est connu sous le nom de <strong>latence</strong> ou RTT, généralement mesuré en millisecondes (ms). Une latence élevée peut entraîner des temps de chargement lents.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>Réponse rapide (0-50ms):</strong> Excellente connexion, idéale.</li>
                            <li><strong>Réponse acceptable (50-150ms):</strong> Bonne connexion.</li>
                            <li><strong>Réponse lente (&gt;150ms):</strong> Retard notable.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">L&apos;importance des tests Ping mondiaux</h2>
                        <p>
                            Tester la connectivité à partir d&apos;un seul emplacement ne montre qu&apos;une partie du tableau. En utilisant un outil de ping mondial comme CheckHost, vous pouvez vérifier l&apos;efficacité du routage et identifier les pannes de réseau régionales.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
