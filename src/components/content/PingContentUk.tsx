import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PingContentUk() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Що таке Ping-тест і як він працює?
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Розуміння команди Ping</h2>
                        <p>
                            Ping-тест — це важливий інструмент діагностики мережі, який використовується для перевірки доступності хоста (веб-сайту, сервера або IP-адреси) в IP-мережі. Він працює шляхом надсилання пакетів ICMP (Internet Control Message Protocol) Echo Request до цільового пункту призначення та очікування відповіді ICMP Echo Reply.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Навіщо вимірювати затримку мережі?</h2>
                        <p>
                            Час, необхідний для передачі цих пакетів від джерела до місця призначення і назад, відомий як <strong>затримка</strong> (latency) або час туди-й-назад (RTT), і зазвичай вимірюється в мілісекундах (мс). Висока затримка може призвести до повільного завантаження веб-сайтів, відставання (лагів) в онлайн-іграх та низької якості аудіо/відео в VoIP додатках.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>Швидка відповідь (0-50 мс):</strong> Відмінне з&apos;єднання, ідеально підходить для додатків у реальному часі.</li>
                            <li><strong>Прийнятна відповідь (50-150 мс):</strong> Добре з&apos;єднання, підходить для загального перегляду веб-сторінок і потокового передавання.</li>
                            <li><strong>Повільна відповідь (&gt;150 мс):</strong> Помітна затримка, яка може вплинути на інтерактивні програми.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Важливість глобального тестування Ping</h2>
                        <p>
                            Перевірка підключення лише з одного місця показує тільки частину картини. Веб-сайт може працювати ідеально для користувачів у Нью-Йорку, але мати значну втрату пакетів для користувачів у Токіо. Використовуючи глобальний інструмент ping, такий як CheckHost, ви можете перевірити ефективність маршрутизації та виявити регіональні збої в мережі на різних континентах одночасно. Це особливо важливо для підприємств, які використовують мережі доставки контенту (CDN), щоб забезпечити глобальну доступність.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
