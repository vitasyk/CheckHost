import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PingContentDe() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Was ist ein Ping-Test und wie funktioniert er?
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Verstehen des Ping-Befehls</h2>
                        <p>
                            Ein Ping-Test ist ein wesentliches Netzwerkdiagnosetool zur Überprüfung der Erreichbarkeit eines Hosts (wie einer Website, eines Servers oder einer IP-Adresse) in einem Internet Protocol (IP)-Netzwerk. Es sendet Internet Control Message Protocol (ICMP) Echo Request-Pakete an das Ziel und wartet auf eine ICMP Echo Reply.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Warum die Netzwerklatenz messen?</h2>
                        <p>
                            Die Zeit, die diese Pakete für den Weg von der Quelle zum Ziel und zurück benötigen, wird als <strong>Latenz</strong> oder Round-Trip-Time (RTT) bezeichnet und meist in Millisekunden (ms) gemessen. Hohe Latenz kann zu langsamen Ladezeiten, Verzögerungen beim Online-Gaming und schlechter Audio-/Videoqualität bei VoIP-Anwendungen führen.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>Schnelle Antwort (0-50ms):</strong> Hervorragende Verbindung, ideal für Echtzeitanwendungen.</li>
                            <li><strong>Akzeptable Antwort (50-150ms):</strong> Gute Verbindung, geeignet für allgemeines Surfen und Streaming.</li>
                            <li><strong>Langsame Antwort (&gt;150ms):</strong> Spürbare Verzögerung, die interaktive Anwendungen beeinträchtigen kann.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Die Bedeutung weltweiter Ping-Tests</h2>
                        <p>
                            Das Testen der Konnektivität von nur einem Standort aus zeigt nur einen Teil des Bildes. Eine Website kann für Benutzer in New York perfekt funktionieren, aber für Benutzer in Tokio unter erheblichen Paketverlusten leiden. Durch die Nutzung eines globalen Ping-Tools wie CheckHost können Sie die Routing-Effizienz überprüfen und regionale Netzwerkausfälle über verschiedene Kontinente hinweg gleichzeitig identifizieren.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
