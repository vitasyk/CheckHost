import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DnsContentPl() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Globalna propagacja DNS i wyszukiwanie rekordów
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Jak działa sprawdzanie DNS?</h2>
                        <p>
                            System nazw domen (DNS) tłumaczy nazwy domen na adresy IP. Sprawdzanie DNS polega na odpytywaniu serwerów nazw w celu pobrania aktualnych rekordów.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Typowe rekordy DNS</h2>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>Rekord A:</strong> Mapuje domenę na IPv4.</li>
                            <li><strong>Rekord AAAA:</strong> Mapuje domenę na IPv6.</li>
                            <li><strong>Rekord MX:</strong> Kieruje pocztę na serwer pocztowy.</li>
                            <li><strong>Rekord CNAME:</strong> Mapuje alias na nazwę kanoniczną.</li>
                            <li><strong>Rekord TXT:</strong> Wykorzystywany do SPF, DKIM i DMARC.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Co to jest propagacja DNS?</h2>
                        <p>
                            Czas potrzebny na rozprzestrzenienie się zmian w rekordach DNS w całym Internecie nazywamy <strong>propagacją DNS</strong>. Może to potrwać do 48 godzin.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
