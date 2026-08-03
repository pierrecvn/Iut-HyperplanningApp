/**
 * Liens profonds vers l'application.
 *
 * Le widget d'écran d'accueil s'exécute hors de l'application : il n'a ni
 * navigation ni contexte React. Demander à Android d'ouvrir une URL est son
 * seul moyen d'amener l'utilisateur sur un écran précis.
 *
 * Le lien est écrit à la main plutôt que construit par expo-linking : une
 * dépendance de moins dans le contexte JavaScript du widget est une source
 * d'échec de moins. En contrepartie, SCHEME doit rester aligné sur
 * `expo.scheme` dans app.json — c'est lui qui produit l'intent-filter du
 * manifeste Android.
 */

const SCHEME = 'iuthyperplanningapp';

/** Format attendu par dayjs côté écran : jour local, pas UTC. */
function jourIso(date: Date): string {
    const mois = `${date.getMonth() + 1}`.padStart(2, '0');
    const jour = `${date.getDate()}`.padStart(2, '0');
    return `${date.getFullYear()}-${mois}-${jour}`;
}

/**
 * Lien vers l'onglet planning, positionné sur un jour donné.
 *
 * Sans date — ou avec une date illisible — le lien ouvre le planning tel
 * quel : mieux vaut l'écran au mauvais jour qu'un lien mort.
 */
export function lienPlanning(date?: string | Date | null): string {
    const base = `${SCHEME}://planning`;
    if (!date) return base;

    const d = typeof date === 'string' ? new Date(date) : date;
    if (Number.isNaN(d.getTime())) return base;

    return `${base}?date=${jourIso(d)}`;
}
