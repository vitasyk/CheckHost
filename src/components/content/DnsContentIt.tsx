import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DnsContentIt() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Propagazione DNS globale e ricerca record
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Come funziona un controllo DNS?</h2>
                        <p>
                            Il Domain Name System (DNS) traduce i nomi di dominio in indirizzi IP. Un controllo DNS interroga i nameserver per recuperare i record attuali associati a un dominio.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Tipi comuni di record DNS</h2>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>Record A:</strong> Mappa un dominio a un indirizzo IPv4.</li>
                            <li><strong>Record AAAA:</strong> Mappa un dominio a un indirizzo IPv6.</li>
                            <li><strong>Record MX:</strong> Indirizza l&apos;email a un server di posta.</li>
                            <li><strong>Record CNAME:</strong> Mappa un alias su un nome canonico.</li>
                            <li><strong>Record TXT:</strong> Spesso usato per le politiche di sicurezza email (SPF, DKIM, DMARC).</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Cos&apos;è la propagazione DNS?</h2>
                        <p>
                            Il tempo necessario affinché gli aggiornamenti si diffondano in tutto il mondo è chiamato <strong>propagazione DNS</strong>.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
