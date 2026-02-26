import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function IpInfoContentEs() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Geolocalización profunda de IP e Inteligencia de Red
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">¿Qué es una dirección IP?</h2>
                        <p>
                            Una dirección IP es una etiqueta numérica única asignada a cada dispositivo conectado a una red informática. Sirve para identificar interfaces de red y proporcionar direccionamiento de ubicación.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Proveedores de geolocalización de IP</h2>
                        <p>
                            Nuestra herramienta consulta múltiples bases de datos líderes en la industria simultáneamente:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>MaxMind:</strong> Conocido por sus bases de datos GeoIP de alta precisión.</li>
                            <li><strong>IPinfo.io:</strong> Especializado en datos lógicos profundos y detalles de ASN.</li>
                            <li><strong>DB-IP y IP2Location:</strong> Proporcionan datos de mapeo alternativos y análisis de ISP.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">ASN y Enrutamiento</h2>
                        <p>
                            Un <strong>Sistema Autónomo (AS)</strong> es una red grande con una política de enrutamiento unificada. Cada AS tiene un número único (<strong>ASN</strong>). Identificar el ASN ayuda a saber qué organización es la propietaria del bloque de IP.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Redes Anycast frente a Unicast</h2>
                        <p>
                            En una red Anycast, la misma dirección IP se transmite desde múltiples ubicaciones físicas. El tráfico se dirige automáticamente al nodo más cercano, reduciendo la latencia.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
