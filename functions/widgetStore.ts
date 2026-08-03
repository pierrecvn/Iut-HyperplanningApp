import { ICalEvent } from '@/interfaces/IcalEvent';
import { createMMKV } from 'react-native-mmkv';

/**
 * Fenêtre d'emploi du temps persistée pour le widget d'écran d'accueil.
 *
 * Le gestionnaire du widget s'exécute hors de l'application, sans état React
 * ni contexte : tout ce qu'il affiche doit venir d'un stockage durable.
 *
 * On persiste une FENÊTRE et non « le prochain cours ». Android impose un
 * plancher de 30 minutes entre deux rafraîchissements périodiques : un
 * prochain cours figé afficherait un cours déjà terminé pendant une
 * demi-heure. Le gestionnaire recalcule à chaque rendu à partir de la fenêtre.
 */

const CLE_FENETRE = 'widget_fenetre_edt';

/** Nombre de cours conservés. Assez pour couvrir plusieurs jours creux. */
const TAILLE_FENETRE = 20;

/** Forme sérialisable — les Date deviennent des chaînes ISO. */
export type EvenementWidget = {
    summary: string;
    start: string;
    end: string;
    location: string;
};

type FenetreEdt = {
    evenements: EvenementWidget[];
    misAJourLe: string;
};

const storage = createMMKV();

/**
 * Enregistre les prochains cours pour le widget.
 *
 * Appelé après chaque chargement réussi de l'emploi du temps. Les cours passés
 * sont écartés : le widget n'en a aucun usage et ils gonfleraient le stockage.
 */
export function enregistrerFenetreEvenements(events: ICalEvent[]): void {
    try {
        const maintenant = Date.now();

        const aVenir = events
            .filter(e => e.end.getTime() > maintenant)
            .sort((a, b) => a.start.getTime() - b.start.getTime())
            .slice(0, TAILLE_FENETRE)
            .map<EvenementWidget>(e => ({
                summary: e.summary,
                start: e.start.toISOString(),
                end: e.end.toISOString(),
                location: e.location ?? '',
            }));

        const fenetre: FenetreEdt = {
            evenements: aVenir,
            misAJourLe: new Date().toISOString(),
        };

        storage.set(CLE_FENETRE, JSON.stringify(fenetre));
        console.log(`Widget : fenêtre enregistrée, ${aVenir.length} cours à venir sur ${events.length}`);
    } catch (error) {
        // Le widget est accessoire : son stockage ne doit jamais faire échouer
        // le chargement de l'emploi du temps.
        console.error('Enregistrement de la fenêtre widget impossible', error);
    }
}

export function lireFenetreEvenements(): FenetreEdt | null {
    try {
        const brut = storage.getString(CLE_FENETRE);
        return brut ? (JSON.parse(brut) as FenetreEdt) : null;
    } catch (error) {
        console.error('Lecture de la fenêtre widget impossible', error);
        return null;
    }
}

/**
 * Recalcule le cours à afficher : celui en cours s'il y en a un, sinon le
 * prochain à venir. Même logique que getCoursSuivant du contexte, mais sans
 * dépendre de React.
 */
export function prochainCoursDepuisFenetre(maintenant: Date = new Date()): EvenementWidget | null {
    const fenetre = lireFenetreEvenements();
    if (!fenetre || fenetre.evenements.length === 0) return null;

    const t = maintenant.getTime();

    const pertinents = fenetre.evenements.filter(e => new Date(e.end).getTime() > t);
    if (pertinents.length === 0) return null;

    return pertinents.reduce((plusProche, e) =>
        new Date(e.start).getTime() < new Date(plusProche.start).getTime() ? e : plusProche
    );
}
