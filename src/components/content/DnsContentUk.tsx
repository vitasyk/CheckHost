import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DnsContentUk() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Глобальне розповсюдження DNS та пошук записів
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Як працює перевірка DNS?</h2>
                        <p>
                            Систему доменних імен (DNS) часто називають &quot;телефонною книгою Інтернету&quot;. Вона перетворює зручні для читання доменні імена (наприклад, check-host.top) на IP-адреси, які комп&apos;ютери використовують для ідентифікації один одного в мережі. Перевірка DNS запитує певні сервери імен (nameservers), щоб отримати поточні записи DNS, пов&apos;язані з доменом.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Поширені типи записів DNS</h2>
                        <p>
                            Розуміння різних типів записів DNS є важливим для адміністраторів веб-сайтів та ІТ-спеціалістів:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>A Record:</strong> Відображає доменне ім&apos;я на IPv4-адресу. Це найпоширеніший тип запису.</li>
                            <li><strong>AAAA Record:</strong> Відображає доменне ім&apos;я на IPv6-адресу, нове покоління IP-адрес.</li>
                            <li><strong>MX Record:</strong> Записи Mail Exchange спрямовують електронну пошту на поштовий сервер. Вирішальне значення для забезпечення доставки електронної пошти.</li>
                            <li><strong>CNAME Record:</strong> Записи Canonical Name відображають псевдонім (alias) на справжнє або &quot;канонічне&quot; доменне ім&apos;я.</li>
                            <li><strong>TXT Record:</strong> Текстові записи містять довільний текст. Вони часто використовуються для перевірки права власності на домен і для політик безпеки електронної пошти, таких як SPF, DKIM та DMARC.</li>
                            <li><strong>NS Record:</strong> Записи Name Server делегують домен набору авторитетних серверів імен.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Що таке DNS розповсюдження (Propagation)?</h2>
                        <p>
                            Коли ви вносите зміни до своїх DNS-записів (наприклад, змінюєте хостинг-провайдера або оновлюєте MX-запис), ці зміни не набувають чинності негайно в усьому Інтернеті. Час, потрібний для того, щоб ці оновлення поширилися на кеші провайдерів (ISP) по всьому світу, називається <strong>DNS розповсюдженням</strong> (propagation). Цей процес може тривати від кількох хвилин до 48 годин, залежно від налаштувань часу життя (TTL) ваших попередніх записів. Наш глобальний інструмент DNS допомагає перевіряти статус розповсюдження з різних географічних розташувань у реальному часі.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
