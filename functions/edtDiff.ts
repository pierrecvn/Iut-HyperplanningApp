import { ICalEvent } from '@/interfaces/IcalEvent';
import { isCancelled } from '@/functions/eventFormat';

/**
 * Comparaison de deux versions d'un emploi du temps.
 *
 * Fonction pure, sans React ni accès réseau : c'est elle qui décide si
 * l'utilisateur reçoit une notification, donc elle doit être testable seule.
 *
 * Contraintes mesurées sur le flux Hyperplanning réel (groupe L2, 11 cours) :
 * - UID présent sur tous les événements et stable entre deux appels — c'est la
 *   seule clé de rapprochement fiable.
 * - SEQUENCE jamais émis, LAST-MODIFIED présent une fois sur onze : aucun
 *   marqueur de révision exploitable, il faut comparer les champs eux-mêmes.
 * - DTSTAMP réécrit à chaque génération : comparer les .ics bruts signalerait
 *   un changement à chaque récupération. D'où une comparaison sur les
 *   événements parsés, DTSTAMP n'étant de toute façon pas conservé.
 */

export type ChangementEdt =
    | { type: 'ajoute'; event: ICalEvent }
    | { type: 'supprime'; event: ICalEvent }
    | { type: 'annule'; event: ICalEvent }
    | { type: 'deplace'; event: ICalEvent; avantStart: Date; avantEnd: Date }
    | { type: 'salle'; event: ICalEvent; avantLocation: string };

/**
 * Normalise un lieu avant comparaison.
 *
 * Hyperplanning renvoie parfois plusieurs salles séparées par des virgules,
 * dans un ordre qui n'est pas garanti stable. Sans ce tri, un simple
 * réordonnancement passerait pour un changement de salle.
 */
function normaliserLieu(lieu: string | null | undefined): string {
    if (!lieu) return '';
    return lieu
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .sort()
        .join(', ');
}

/** Deux événements occupent-ils le même créneau ? */
function memeCreneau(a: ICalEvent, b: ICalEvent): boolean {
    return a.start.getTime() === b.start.getTime()
        && a.end.getTime() === b.end.getTime();
}

/**
 * Compare deux états de l'emploi du temps et retourne les changements.
 *
 * Seuls les événements **à venir** sont considérés. La fenêtre du flux
 * Hyperplanning glisse : des cours passés en sortent naturellement, et sans ce
 * filtre ils seraient signalés comme des suppressions.
 *
 * Les événements sans UID sont ignorés : on ne peut pas les rapprocher de
 * façon fiable, et un faux positif coûte plus cher qu'un changement manqué.
 */
export function comparerEdt(
    avant: ICalEvent[],
    apres: ICalEvent[],
    maintenant: Date = new Date()
): ChangementEdt[] {
    const futurAvecUid = (events: ICalEvent[]) =>
        events.filter(e => e.uid && e.start.getTime() > maintenant.getTime());

    const indexAvant = new Map<string, ICalEvent>();
    for (const e of futurAvecUid(avant)) indexAvant.set(e.uid as string, e);

    const indexApres = new Map<string, ICalEvent>();
    for (const e of futurAvecUid(apres)) indexApres.set(e.uid as string, e);

    const changements: ChangementEdt[] = [];

    for (const [uid, evtApres] of indexApres) {
        const evtAvant = indexAvant.get(uid);

        if (!evtAvant) {
            changements.push({ type: 'ajoute', event: evtApres });
            continue;
        }

        // L'annulation prime sur le reste : Hyperplanning n'émet pas
        // STATUS:CANCELLED, il préfixe l'intitulé. Un cours annulé change donc
        // aussi de summary, et souvent de salle — inutile de signaler les deux.
        if (isCancelled(evtApres) && !isCancelled(evtAvant)) {
            changements.push({ type: 'annule', event: evtApres });
            continue;
        }

        if (!memeCreneau(evtAvant, evtApres)) {
            changements.push({
                type: 'deplace',
                event: evtApres,
                avantStart: evtAvant.start,
                avantEnd: evtAvant.end,
            });
            continue;
        }

        if (normaliserLieu(evtAvant.location) !== normaliserLieu(evtApres.location)) {
            changements.push({
                type: 'salle',
                event: evtApres,
                avantLocation: evtAvant.location,
            });
        }
    }

    for (const [uid, evtAvant] of indexAvant) {
        if (!indexApres.has(uid)) {
            changements.push({ type: 'supprime', event: evtAvant });
        }
    }

    changements.sort((a, b) => a.event.start.getTime() - b.event.start.getTime());
    return changements;
}
