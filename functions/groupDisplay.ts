import { CustomCalendar } from '@/functions/calendarService';

/**
 * Nom lisible d'un groupe par défaut.
 *
 * Fonction pure, à domicile neutre : le sélecteur de groupe l'utilise pour
 * son libellé, et le gestionnaire de calendriers pour nommer l'entrée
 * « (Principal) » qu'il fabrique à partir du groupe courant. Les deux
 * fonctionnalités en dépendent, aucune ne la possède.
 *
 * Extrait tel quel de parametres.tsx:160, comportement inchangé.
 */
export function getGroupDisplayName(grp: string, calendars: CustomCalendar[]): string {
    if (!grp) return 'Sélectionner un groupe';

    const customCal = calendars.find(c => c.url === grp);
    if (customCal) return `${customCal.name} (Perso)`;

    if (grp.startsWith('http')) return 'Mon Planning (URL)';
    return grp;
}
