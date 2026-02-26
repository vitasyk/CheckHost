import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function HttpContentIt() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Monitoraggio completo HTTP e Uptime
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Cos&apos;è un controllo di stato HTTP?</h2>
                        <p>
                            Un controllo HTTP simula il tentativo di un utente di visitare una pagina web. Si assicura che il software del server web (come Apache o Nginx) stia effettivamente rispondendo con un contenuto valido.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Comprendere i codici di stato HTTP</h2>
                        <p>
                            Quando i nostri nodi di monitoraggio richiedono il tuo sito, ricevono un codice di stato. Comprendere questi codici è fondamentale:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>200 OK:</strong> Il sito è pienamente operativo.</li>
                            <li><strong>301 / 302:</strong> La risorsa è stata spostata.</li>
                            <li><strong>403 / 404:</strong> Errori lato client, pagine mancanti.</li>
                            <li><strong>Errori 5xx:</strong> Guasti critici dell&apos;infrastruttura.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Perché il monitoraggio Uptime è importante per la SEO</h2>
                        <p>
                            I motori di ricerca come Google danno priorità all&apos;esperienza utente. Se i bot riscontrano frequenti errori 5xx o timeout prolungati, il tuo posizionamento organico ne risentirà.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
