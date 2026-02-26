import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function HttpContentEs() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Monitoreo integral de HTTP y tiempo de actividad web
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">¿Qué es una verificación de estado HTTP?</h2>
                        <p>
                            Una verificación HTTP simula a un usuario intentando visitar una página web. A diferencia de un simple ping ICMP, asegura que el software del servidor web (como Apache, Nginx o IIS) realmente esté respondiendo con contenido válido.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Entendiendo los códigos de estado HTTP</h2>
                        <p>
                            Cuando nuestros nodos de monitoreo solicitan su sitio web, reciben un código de estado HTTP. Comprender estos códigos es crítico:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>200 OK:</strong> Respuesta estándar para solicitudes exitosas.</li>
                            <li><strong>301 / 302 Redirect:</strong> El recurso ha sido movido. Excesivas redirecciones pueden ralentizar tu sitio.</li>
                            <li><strong>403 Forbidden / 404 Not Found:</strong> Errores del cliente que indican páginas faltantes o mala configuración.</li>
                            <li><strong>500 / 502 / 503 Server Errors:</strong> Fallos críticos de infraestructura.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Por qué el monitoreo del tiempo de actividad es clave para el SEO</h2>
                        <p>
                            Los motores de búsqueda como Google priorizan enormemente la experiencia del usuario, incluida la disponibilidad del sitio. Si los bots encuentran errores 5xx frecuentes, sus clasificaciones orgánicas se verán afectadas. El uso de una herramienta global de monitoreo ayuda a detectar estos problemas.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
