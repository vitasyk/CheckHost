import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PingContentIt() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Cos&apos;è un test Ping e come funziona?
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Comprendere il comando Ping</h2>
                        <p>
                            Un test Ping è uno strumento diagnostico di rete vitale utilizzato per testare la raggiungibilità di un host (come un sito web, un server o un indirizzo IP) su una rete IP. Invia pacchetti di richiesta eco ICMP e attende una risposta.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Perché misurare la latenza di rete?</h2>
                        <p>
                            Il tempo necessario ai pacchetti per viaggiare avanti e indietro è noto come <strong>latenza</strong> (RTT). Un&apos;alta latenza provoca caricamenti lenti e ritardi nelle applicazioni in tempo reale come il VoIP o il gaming.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>Risposta veloce (0-50ms):</strong> Ottima connessione.</li>
                            <li><strong>Accettabile (50-150ms):</strong> Buona connessione.</li>
                            <li><strong>Risposta lenta (&gt;150ms):</strong> Ritardo evidente.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">L&apos;importanza dei test Ping globali</h2>
                        <p>
                            Testare da una singola posizione mostra solo una parte del quadro. Un sito potrebbe funzionare bene a New York ma perdere pacchetti per gli utenti a Tokyo. Un test globale aiuta a identificare eventuali interruzioni regionali simultaneamente.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
