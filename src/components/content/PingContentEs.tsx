import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PingContentEs() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        ¿Qué es una prueba de Ping y cómo funciona?
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Entendiendo el comando Ping</h2>
                        <p>
                            Una prueba de Ping es una herramienta de diagnóstico de red esencial utilizada para probar la accesibilidad de un host (como un sitio web, servidor o dirección IP) en una red de Protocolo de Internet (IP). Funciona enviando paquetes de solicitud de eco del Protocolo de mensajes de control de Internet (ICMP) al destino y esperando una respuesta.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">¿Por qué medir la latencia de la red?</h2>
                        <p>
                            El tiempo que tardan estos paquetes en viajar desde el origen hasta el destino y regresar se conoce como <strong>latencia</strong> o tiempo de ida y vuelta (RTT), generalmente medido en milisegundos (ms). La alta latencia puede resultar en tiempos lentos de carga, retrasos en juegos y mala calidad de audio/video.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>Respuesta rápida (0-50ms):</strong> Excelente conexión, ideal para aplicaciones en tiempo real.</li>
                            <li><strong>Respuesta aceptable (50-150ms):</strong> Buena conexión, adecuada para navegación web general y streaming.</li>
                            <li><strong>Respuesta lenta (&gt;150ms):</strong> Retraso notable, que puede afectar a las aplicaciones interactivas.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">La Importancia de las Pruebas de Ping Globales</h2>
                        <p>
                            Probar la conectividad desde una sola ubicación solo muestra parte del panorama. Un sitio web podría funcionar perfectamente para los usuarios en Nueva York pero sufrir una pérdida significativa de paquetes para los usuarios en Tokio. Al utilizar una herramienta de ping global como CheckHost, puede verificar la eficiencia del enrutamiento e identificar interrupciones regionales simultáneamente.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
