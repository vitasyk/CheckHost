import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function HttpContentFr() {
    return (
        <section className="mt-16 mb-8 text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                        Surveillance complète de la disponibilité des sites Web et HTTP
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Qu&apos;est-ce qu&apos;une vérification d&apos;état HTTP?</h2>
                        <p>
                            Une vérification HTTP simule un utilisateur tentant de visiter une page Web. Contrairement à un simple ping ICMP, une vérification HTTP s&apos;assure que le logiciel du serveur (comme Apache, Nginx ou IIS) répond avec un contenu valide.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Comprendre les codes d&apos;état HTTP</h2>
                        <p>
                            Lorsque nos nœuds de surveillance interrogent votre site, ils reçoivent un code d&apos;état HTTP standard. Comprendre ces codes est critique :
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>200 OK :</strong> Réponse standard pour les requêtes réussies.</li>
                            <li><strong>301 / 302 Redirect :</strong> La ressource a été déplacée.</li>
                            <li><strong>403 Forbidden / 404 Not Found :</strong> Erreurs côté client (page manquante).</li>
                            <li><strong>500 / 502 / 503 Server Errors :</strong> Défaillances critiques de l&apos;infrastructure (serveur hors ligne).</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Pourquoi la surveillance mondiale de la disponibilité est importante pour le référencement (SEO)?</h2>
                        <p>
                            Les moteurs de recherche comme Google privilégient largement l&apos;expérience utilisateur. Si les robots rencontrent des erreurs 5xx fréquentes lors de l&apos;exploration de votre site, vos classements organiques en souffriront. Utiliser un outil de surveillance HTTP mondial aide à détecter ces problèmes.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
