import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function HttpContentNl() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Uitgebreide HTTP- en uptime-bewaking van websites
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Wat is een HTTP-statuscontrole?</h2>
                        <p>
                            Een HTTP-controle simuleert een gebruiker die een webpagina probeert te bezoeken. Het zorgt ervoor dat de webserversoftware (zoals Apache, Nginx of IIS) daadwerkelijk reageert met geldige inhoud.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">HTTP-statuscodes begrijpen</h2>
                        <p>
                            Wanneer onze monitoringknooppunten uw website opvragen, ontvangen ze een standaard HTTP-statuscode. Het begrijpen hiervan is cruciaal:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>200 OK:</strong> Het standaardantwoord voor succesvolle verzoeken.</li>
                            <li><strong>301 / 302 Redirect:</strong> De opgevraagde bron is verplaatst.</li>
                            <li><strong>403 / 404:</strong> Fouten aan de clientzijde die wijzen op ontbrekende pagina&apos;s.</li>
                            <li><strong>500 / 502 / 503:</strong> Kritieke infrastructuurfouten.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Waarom wereldwijde Uptime Monitoring belangrijk is voor SEO</h2>
                        <p>
                            Zoekmachines zoals Google geven prioriteit aan gebruikerservaring, waaronder website-beschikbaarheid. Als zoekmachinebots frequente 5xx-fouten tegenkomen, zullen uw organische rangschikkingen eronder lijden.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
