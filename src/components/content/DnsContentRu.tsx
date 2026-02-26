import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DnsContentRu() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Глобальное распространение DNS и поиск записей
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Как работает проверка DNS?</h2>
                        <p>
                            Система доменных имен (DNS) — это «телефонная книга интернета». Она переводит понятные человеку доменные имена в IP-адреса. Проверка DNS опрашивает серверы имен для получения текущих записей домена.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Основные типы DNS-записей</h2>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>A-запись:</strong> Сопоставляет домен с IPv4-адресом.</li>
                            <li><strong>AAAA-запись:</strong> Сопоставляет домен с IPv6-адресом.</li>
                            <li><strong>MX-запись:</strong> Направляет почту на почтовый сервер.</li>
                            <li><strong>CNAME-запись:</strong> Сопоставляет псевдоним с каноническим именем.</li>
                            <li><strong>TXT-запись:</strong> Текстовые записи, часто используемые для SPF, DKIM и DMARC.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Что такое распространение DNS?</h2>
                        <p>
                            Время, необходимое для обновления DNS-записей во всем мире, называется <strong>распространением (propagation) DNS</strong>. Процесс может занимать до 48 часов.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
