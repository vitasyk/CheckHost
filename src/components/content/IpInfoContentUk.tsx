import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function IpInfoContentUk() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Глибока геолокація IP та аналіз мережі
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Що таке IP-адреса?</h2>
                        <p>
                            IP-адреса (Internet Protocol) — це унікальна числова мітка, призначена кожному пристрою, підключеному до комп&apos;ютерної мережі, що використовує Інтернет-протокол для зв&apos;язку. Вона виконує дві основні функції: ідентифікація хоста (або мережевого інтерфейсу) та адресація місцезнаходження.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Розуміння провайдерів IP-геолокації</h2>
                        <p>
                            IP-геолокація — це процес оцінки реального географічного розташування підключеного до Інтернету пристрою за допомогою його IP-адреси. Однак різні геолокаційні бази даних часто надають різні результати, оскільки відображення IP-адрес на фізичні місця розташування є неточною наукою, заснованою на даних від інтернет-провайдерів, реєстрів та маршрутизації мережі.
                        </p>
                        <p className="mt-2">
                            Наш інструмент запитує одразу кілька провідних баз даних одночасно, щоб забезпечити найточніший консенсус:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>MaxMind:</strong> Відомий провайдер, який славиться своїми високоточними базами даних GeoIP, що широко використовуються в боротьбі з корпоративним шахрайством.</li>
                            <li><strong>IPinfo.io:</strong> Спеціалізується на наданні глибоких логічних даних, включаючи виявлення Anycast, деталі ASN та інформацію про компанію.</li>
                            <li><strong>DB-IP та IP2Location:</strong> Надають альтернативні дані картографування, часто пропонуючи нюанси щодо інтернет-провайдерів і аналіз типу з&apos;єднання (наприклад, мобільний зв&apos;язок проти широкосмугового).</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Автономні системи (ASN) і маршрутизація</h2>
                        <p>
                            <strong>Автономна система (AS)</strong> — це велика мережа або група мереж, що має уніфіковану політику маршрутизації та зазвичай управляється однією великою організацією, такою як Інтернет-провайдер (ISP), технологічний гігант (наприклад, Google або Amazon) або університет. Кожній AS призначається глобально унікальний номер <strong>Autonomous System Number (ASN)</strong>.
                        </p>
                        <p className="mt-2">
                            Ідентифікація ASN, пов&apos;язаного з IP-адресою, допомагає фахівцям з безпеки та мережевим інженерам зрозуміти, якій організації належить блок IP-адрес і як трафік маршрутизується до нього через магістраль Інтернету.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Мережі Anycast проти Unicast</h2>
                        <p>
                            Сучасні мережі доставки контенту (CDN) часто використовують маршрутизацію <strong>Anycast</strong>. У традиційній мережі Unicast одна IP-адреса відповідає рівно одному фізичному серверу в одному місці. У мережі Anycast одна й та сама IP-адреса транслюється з кількох фізичних точок по всьому світу. Коли ви робите запит до Anycast IP, маршрутизатори автоматично спрямовують ваш трафік до найближчого вузла. Це значно зменшує затримку та покращує стійкість до DDoS-атак.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
