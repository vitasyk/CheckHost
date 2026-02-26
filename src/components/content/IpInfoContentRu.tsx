import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function IpInfoContentRu() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Глубокая геолокация IP и сетевой анализ
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Что такое IP-адрес?</h2>
                        <p>
                            IP-адрес — это уникальный числовой идентификатор устройства в компьютерной сети. Он необходим для идентификации интерфейса и определения его местоположения в сети.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">О провайдерах геолокации</h2>
                        <p>
                            Наш инструмент опрашивает несколько ведущих баз данных одновременно для получения наиболее точного результата:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>MaxMind:</strong> Известен высокоточными базами данных GeoIP.</li>
                            <li><strong>IPinfo.io:</strong> Специализируется на логических данных, деталях ASN и информации о компаниях.</li>
                            <li><strong>DB-IP и IP2Location:</strong> Предоставляют альтернативные данные и анализ ISP.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Автономные системы (ASN) и маршрутизация</h2>
                        <p>
                            <strong>Автономная система (AS)</strong> — это крупная сеть или группа сетей с единой политикой маршрутизации. Каждой AS присваивается уникальный номер (<strong>ASN</strong>).
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Anycast против Unicast сетей</h2>
                        <p>
                            В сетях Anycast один и тот же IP-адрес транслируется из нескольких локаций по всему миру. Трафик автоматически направляется к ближайшему узлу, что снижает задержку.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
