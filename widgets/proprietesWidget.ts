import { lienPlanning } from '@/functions/lienProfond';
import { prochainCoursDepuisFenetre } from '@/functions/widgetStore';
import { themeWidgetSombre } from '@/functions/widgetTheme';
import { contenuCours } from '@/widgets/contenuCours';
import type { ProchainCoursWidgetProps } from '@/widgets/ProchainCoursWidget';

/**
 * Rassemble tout ce dont le widget a besoin pour un rendu.
 *
 * Point d'entrée unique, appelé aussi bien par le gestionnaire lancé par
 * Android que par le rafraîchissement déclenché depuis l'application : les
 * deux chemins passent par ici pour rester identiques.
 *
 * Tout est relu à chaque appel, jamais mémorisé. Android impose 30 minutes
 * minimum entre deux rafraîchissements périodiques ; un contenu figé
 * afficherait un cours déjà terminé pendant une demi-heure.
 */
export function proprietesWidget(maintenant: Date = new Date()): ProchainCoursWidgetProps {
    const cours = prochainCoursDepuisFenetre(maintenant);

    return {
        cours: contenuCours(cours, maintenant),
        // Sans cours à venir, le lien ouvre le planning tel quel plutôt que
        // rien : le widget reste un raccourci vers l'application.
        lien: lienPlanning(cours?.start),
        sombre: themeWidgetSombre(),
    };
}
