import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function HttpContentDe() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Umfassende HTTP- & Website-Verfügbarkeitsüberwachung
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Was ist eine HTTP-Statusprüfung?</h2>
                        <p>
                            Eine HTTP-Prüfung simuliert den Versuch eines Benutzers, eine Webseite zu besuchen. Im Gegensatz zu einem einfachen ICMP-Ping, stellt eine HTTP-Prüfung sicher, dass die Webserver-Software (wie Apache, Nginx oder IIS) tatsächlich mit gültigen Inhalten antwortet.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">HTTP-Statuscodes verstehen</h2>
                        <p>
                            Wenn unsere Überwachungsknoten Ihre Website anfordern, erhalten sie einen HTTP-Statuscode. Das Verständnis dieser Codes ist entscheidend:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>200 OK:</strong> Die Standardantwort für erfolgreiche Anfragen. Die Website ist voll funktionsfähig.</li>
                            <li><strong>301 / 302 Redirect:</strong> Die URL wurde umgeleitet.</li>
                            <li><strong>403 Forbidden / 404 Not Found:</strong> Client-Fehler, die auf fehlende Seiten oder Konfigurationsprobleme hinweisen.</li>
                            <li><strong>500 / 502 / 503 Server Errors:</strong> Kritische Infrastrukturausfälle (Server, Datenbank oder Proxy offline).</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Warum globale Verfügbarkeitsüberwachung für SEO wichtig ist</h2>
                        <p>
                            Suchmaschinen wie Google legen großen Wert auf die Benutzererfahrung, wozu auch die Verfügbarkeit der Website gehört. Häufige 5xx-Fehler oder Timeouts beeinträchtigen Ihre organischen Rankings. Ein globales HTTP-Überwachungstool hilft Ihnen bei der Erkennung von Problemen.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
