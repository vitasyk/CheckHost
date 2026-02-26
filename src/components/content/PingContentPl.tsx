import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PingContentPl() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Czym jest test Ping i jak działa?
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Zrozumienie polecenia Ping</h2>
                        <p>
                            Test Ping to podstawowe narzędzie diagnostyczne sieci służące do sprawdzania osiągalności hosta (np. strony internetowej, serwera lub adresu IP) w sieci IP. Polega na wysyłaniu pakietów żądania echa ICMP do celu i oczekiwaniu na odpowiedź ICMP.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Dlaczego warto mierzyć opóźnienia sieci?</h2>
                        <p>
                            Czas, w którym pakiety przemieszczają się od źródła do celu i z powrotem to <strong>opóźnienie</strong>. Wysokie opóźnienie skutkuje powolnym ładowaniem witryn i opóźnieniami w grach.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>Szybka odpowiedź (0-50 ms):</strong> Doskonałe połączenie.</li>
                            <li><strong>Akceptowalna (50-150 ms):</strong> Dobre połączenie.</li>
                            <li><strong>Powolna (&gt;150 ms):</strong> Wyraźne opóźnienie.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Znaczenie globalnych testów Ping</h2>
                        <p>
                            Testowanie połączenia z jednej lokalizacji to za mało. Strona internetowa może działać idealnie dla użytkowników w Europie, ale wykazywać dużą utratę pakietów w Azji. Korzystając z globalnego narzędzia do pingowania, takiego jak CheckHost, można zidentyfikować te problemy.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
