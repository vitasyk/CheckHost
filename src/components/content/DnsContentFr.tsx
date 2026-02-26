import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DnsContentFr() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Propagation DNS mondiale et recherche d&apos;enregistrements
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Comment fonctionne une vérification DNS?</h2>
                        <p>
                            Le système de noms de domaine (DNS) est souvent appelé l&apos;annuaire de l&apos;internet. Il traduit les noms de domaine lisibles par l&apos;homme en adresses IP. Une vérification DNS interroge les serveurs de noms pour récupérer les enregistrements actuels.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Types d&apos;enregistrements DNS courants</h2>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>Enregistrement A:</strong> Associe un nom de domaine à une adresse IPv4.</li>
                            <li><strong>Enregistrement AAAA:</strong> Associe un nom de domaine à une adresse IPv6.</li>
                            <li><strong>Enregistrement MX:</strong> Dirige l&apos;e-mail vers un serveur de messagerie.</li>
                            <li><strong>Enregistrement CNAME:</strong> Mappe un alias vers un nom de domaine canonique.</li>
                            <li><strong>Enregistrement TXT:</strong> Souvent utilisé pour SPF, DKIM et DMARC.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Qu&apos;est-ce que la propagation DNS?</h2>
                        <p>
                            Le temps nécessaire pour que les mises à jour DNS se propagent dans les caches des FAI du monde entier est appelé <strong>propagation DNS</strong>. Cela peut prendre jusqu&apos;à 48 heures.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
