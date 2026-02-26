import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function HttpContentPl() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Kompleksowe monitorowanie HTTP i dostępności
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Czym jest test statusu HTTP?</h2>
                        <p>
                            Test HTTP symuluje próbę odwiedzenia strony przez użytkownika. Upewnia się, że oprogramowanie serwera WWW (Apache, Nginx itp.) faktycznie odpowiada prawidłową zawartością w warstwie aplikacji.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Zrozumienie kodów statusu HTTP</h2>
                        <p>
                            Gdy nasze węzły żądają Twojej witryny, otrzymują standardowy kod statusu. Zrozumienie tych kodów jest kluczowe:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>200 OK:</strong> Witryna jest w pełni sprawna.</li>
                            <li><strong>301 / 302:</strong> Zasób został przeniesiony.</li>
                            <li><strong>403/404:</strong> Błędy po stronie klienta (brak strony).</li>
                            <li><strong>5xx:</strong> Krytyczne awarie infrastruktury.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Dlaczego globalny monitoring jest ważny dla SEO</h2>
                        <p>
                            Wyszukiwarki przyznają priorytet doświadczeniom użytkowników. Jeśli boty napotkają częste błędy 5xx, Twoje pozycje organiczne ucierpią. Globalne narzędzie monitorujące HTTP pomaga szybko je wykryć.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
