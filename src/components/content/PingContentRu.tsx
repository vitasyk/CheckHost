import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PingContentRu() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Что такое Ping тест и как он работает?
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Понимание команды Ping</h2>
                        <p>
                            Ping тест — это важный инструмент диагностики сети, используемый для проверки доступности хоста (сайта, сервера или IP) в сети IP. Он отправляет ICMP-запросы эхо-ответа и ждет обратной связи от целевого адреса.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Зачем измерять задержку сети?</h2>
                        <p>
                            Время, необходимое пакету для того, чтобы достичь цели и вернуться, называется <strong>задержкой</strong> или RTT. Оно измеряется в миллисекундах (мс). Высокий пинг приводит к медленной загрузке сайтов и лагам в приложениях.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>Быстрый отклик (0-50 мс):</strong> Отличное соединение.</li>
                            <li><strong>Приемлемый (50-150 мс):</strong> Хорошее соединение.</li>
                            <li><strong>Медленный (&gt;150 мс):</strong> Заметная задержка.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Важность глобального пингования</h2>
                        <p>
                            Проверка только из одной локации не показывает полную картину. Сайт может работать отлично для пользователей в Нью-Йорке, но терять пакеты для Токио. Использование CheckHost помогает выявить региональные сбои и неполадки маршрутизации.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
