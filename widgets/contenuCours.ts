import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import type { EvenementWidget } from '@/functions/widgetStore';

dayjs.locale('fr');

/**
 * Mise en forme du cours affiché par le widget.
 *
 * Isolée du reste pour deux raisons : elle est la seule partie testable sans
 * appareil, et elle est appelée depuis deux endroits — le gestionnaire du
 * widget et le rafraîchissement demandé par l'application. Les deux doivent
 * produire exactement le même rendu, sans quoi le widget changerait
 * d'apparence selon qui l'a redessiné.
 *
 * L'import de widgetStore est volontairement `import type` : il disparaît à la
 * compilation, ce qui garde ce module libre de MMKV et donc exécutable sous
 * jest.
 */

export type ContenuCours = {
    titre: string;
    horaire: string;
    salle: string;
    enCours: boolean;
};

export function contenuCours(
    cours: EvenementWidget | null,
    maintenant: Date = new Date()
): ContenuCours | null {
    if (!cours) return null;

    const debut = dayjs(cours.start);
    const fin = dayjs(cours.end);
    const t = dayjs(maintenant);

    return {
        titre: cours.summary,
        horaire: `${debut.format('ddd D MMM')} · ${debut.format('HH:mm')} - ${fin.format('HH:mm')}`,
        salle: cours.location || 'Salle non précisée',
        // À l'instant pile du début, le cours est en cours et non « prochain ».
        enCours: !debut.isAfter(t) && fin.isAfter(t),
    };
}
