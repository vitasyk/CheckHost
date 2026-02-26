import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DnsContentEs() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Propagación Global de DNS y Búsqueda de Registros
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">¿Cómo funciona una verificación de DNS?</h2>
                        <p>
                            El Sistema de Nombres de Dominio (DNS) es a menudo referido como el &quot;directorio telefónico de Internet&quot;. Traduce nombres de dominio legibles para humanos en direcciones IP. Una verificación de DNS consulta servidores de nombres específicos para recuperar los registros actuales.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Tipos comunes de registros DNS</h2>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>Registro A:</strong> Asocia un dominio con una dirección IPv4.</li>
                            <li><strong>Registro AAAA:</strong> Asocia un dominio con una dirección IPv6.</li>
                            <li><strong>Registro MX:</strong> Registros de intercambio de correo.</li>
                            <li><strong>Registro CNAME:</strong> Mapas de alias a nombres de dominio canónicos.</li>
                            <li><strong>Registro TXT:</strong> Registros de texto utilizados para SPF, DKIM y DMARC.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">¿Qué es la propagación de DNS?</h2>
                        <p>
                            Cuando realizas cambios en tus registros DNS, estos no surten efecto inmediatamente. El tiempo que tardan estas actualizaciones en extenderse por todo Internet se llama <strong>propagación de DNS</strong>.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
