import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DnsContentDe() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Globale DNS-Verbreitung & Record-Abfrage
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Wie funktioniert eine DNS-Prüfung?</h2>
                        <p>
                            Das Domain Name System (DNS) wird oft als das &quot;Telefonbuch des Internets&quot; bezeichnet. Es übersetzt menschenlesbare Domainnamen (wie check-host.top) in IP-Adressen. Eine DNS-Prüfung fragt spezifische Nameserver ab, um die aktuellen DNS-Einträge einer Domain abzurufen.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Häufige DNS-Eintragstypen</h2>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>A Record:</strong> Verknüpft eine Domain mit einer IPv4-Adresse.</li>
                            <li><strong>AAAA Record:</strong> Verknüpft eine Domain mit einer IPv6-Adresse.</li>
                            <li><strong>MX Record:</strong> Mail Exchange Einträge leiten E-Mails an einen Mailserver weiter.</li>
                            <li><strong>CNAME Record:</strong> Verknüpft einen Alias-Namen mit einem echten Domainnamen.</li>
                            <li><strong>TXT Record:</strong> Text-Einträge für Verifizierungen wie SPF, DKIM und DMARC.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Was ist die DNS-Verbreitung (Propagation)?</h2>
                        <p>
                            Wenn Sie DNS-Einträge ändern, werden diese nicht sofort überall im Internet wirksam. Die Zeit, die diese Aktualisierungen benötigen, um sich zu verbreiten, wird <strong>DNS-Propagation</strong> genannt. Dieser Vorgang kann von wenigen Minuten bis zu 48 Stunden dauern.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
