import type { ICalEvent } from '@/interfaces/IcalEvent';

/**
 * Ce qui part dans l'agenda de l'appareil, et sous quelle forme.
 *
 * Séparé de functions/exportAgenda pour rester exécutable sans expo-calendar,
 * donc testable : c'est ici que se prennent les décisions discutables — quels
 * cours entrent dans la période, comment reconnaître les événements qu'on a
 * écrits — et nulle part ailleurs.
 */

/**
 * Signature ajoutée à la fin de chaque note.
 *
 * Elle sert de marqueur : à la ré-exportation, seuls les événements qui la
 * portent sont effacés. Un cours ajouté à la main par l'utilisateur dans ce
 * calendrier survit donc à un nouvel export.
 *
 * Un identifiant technique aurait fait le même travail, mais celui-ci a
 * l'avantage d'être lisible dans l'application d'agenda : il explique d'où
 * vient l'événement au lieu de l'encombrer.
 */
export const SIGNATURE_EXPORT = '— Exporté depuis Iut-HyperplanningApp';

/** Reconnaît un événement écrit par l'application. */
export function estExporteParNous(notes: string | null | undefined): boolean {
    return (notes ?? '').includes(SIGNATURE_EXPORT);
}

export function noteDuCours(cours: ICalEvent): string {
    return [cours.description?.trim(), SIGNATURE_EXPORT].filter(Boolean).join('\n\n');
}

/**
 * Les cours qui commencent dans la période, bornes comprises.
 *
 * Le tri sur le début est retenu plutôt que le chevauchement : l'utilisateur
 * choisit des jours, et s'attend aux cours de ces jours-là. Un cours à cheval
 * sur minuit — inexistant dans un emploi du temps d'IUT — serait rattaché à son
 * jour de début, ce qui reste le comportement le moins surprenant.
 */
export function coursAExporter(events: ICalEvent[], debut: Date, fin: Date): ICalEvent[] {
    const t1 = debut.getTime();
    const t2 = fin.getTime();

    return events
        .filter(e => {
            const t = e.start.getTime();
            return t >= t1 && t <= t2;
        })
        .sort((a, b) => a.start.getTime() - b.start.getTime());
}
