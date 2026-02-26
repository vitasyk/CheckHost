import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function HttpContentRu() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Комплексный мониторинг HTTP и доступности сайтов
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Что такое проверка HTTP-статуса?</h2>
                        <p>
                            Проверка HTTP имитирует попытку пользователя посетить веб-страницу. В отличие от простого ICMP-пинга, она гарантирует, что программное обеспечение веб-сервера (например, Apache, Nginx или IIS) действительно отвечает валидным контентом.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Понимание кодов состояния HTTP</h2>
                        <p>
                            Когда наши узлы мониторинга запрашивают ваш сайт, они получают стандартный код состояния HTTP. Понимание этих кодов критически важно:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>200 OK:</strong> Успешный запрос. Сайт полностью работоспособен.</li>
                            <li><strong>301 / 302 Redirect:</strong> Ресурс перемещен. Чрезмерные цепочки редиректов могут замедлить сайт.</li>
                            <li><strong>403 Forbidden / 404 Not Found:</strong> Ошибки на стороне клиента. Страница не найдена или нет доступа.</li>
                            <li><strong>500 / 502 / 503 Server Errors:</strong> Критические сбои инфраструктуры (сервер или база данных недоступны).</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Почему глобальный мониторинг важен для SEO</h2>
                        <p>
                            Поисковые системы, такие как Google, уделяют огромное внимание пользовательскому опыту, включая доступность сайта. Если поисковые боты часто сталкиваются с 5xx ошибками, ваши органические рейтинги пострадают. Использование глобального инструмента HTTP-мониторинга помогает вовремя обнаружить эти проблемы.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
