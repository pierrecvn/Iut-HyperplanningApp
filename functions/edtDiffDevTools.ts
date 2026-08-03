import { cleCache } from '@/functions/hyperplanningIcal';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Outils de développement pour la détection de changement d'emploi du temps.
 *
 * Le chemin nominal de cette feature — une notification effectivement envoyée —
 * ne peut pas être observé à la demande : il faut qu'Hyperplanning modifie
 * réellement quelque chose. Ces fonctions fabriquent le cas en altérant le
 * cache local, de sorte que la récupération suivante voie un vrai écart.
 *
 * Réservé à __DEV__ : n'altérer le cache que délibérément.
 */

/** Décale une heure iCal (HHMMSS) d'un nombre d'heures, en restant valide. */
function decalerHeure(heure: string, decalage: number): string {
    const h = parseInt(heure.slice(0, 2), 10);
    const nouvelle = (h + decalage + 24) % 24;
    return String(nouvelle).padStart(2, '0') + heure.slice(2);
}

/**
 * Altère le cache pour provoquer deux changements détectables :
 * un déplacement horaire sur le premier cours, un changement de salle sur le
 * second. La prochaine récupération les verra comme de vrais écarts.
 *
 * @returns un compte rendu lisible de ce qui a été modifié
 */
export async function simulerChangementEdt(groupe: string): Promise<string> {
    const cle = cleCache(groupe, true);
    const ics = await AsyncStorage.getItem(cle);

    if (!ics) return `Aucun cache pour ${groupe} — ouvre le planning d'abord.`;

    const blocs = ics.split('BEGIN:VEVENT');
    if (blocs.length < 3) return `Cache trop court pour ${groupe} (${blocs.length - 1} cours).`;

    const rapport: string[] = [];

    // Premier cours : on avance l'horaire d'une heure -> « déplacé »
    const avecHoraireDecale = blocs[1]
        .replace(/^(DTSTART:\d{8}T)(\d{6})/m, (_, prefixe, heure) => prefixe + decalerHeure(heure, -1))
        .replace(/^(DTEND:\d{8}T)(\d{6})/m, (_, prefixe, heure) => prefixe + decalerHeure(heure, -1));

    if (avecHoraireDecale !== blocs[1]) {
        blocs[1] = avecHoraireDecale;
        rapport.push('1 déplacement horaire');
    }

    // Deuxième cours : on change la salle -> « changement de salle »
    const avecSalleChangee = blocs[2].replace(
        /^(LOCATION[^:]*:)(.*)$/m,
        (_, prefixe) => `${prefixe}SALLE-TEMOIN`
    );

    if (avecSalleChangee !== blocs[2]) {
        blocs[2] = avecSalleChangee;
        rapport.push('1 changement de salle');
    }

    if (rapport.length === 0) return 'Rien n\'a pu être altéré dans le cache.';

    await AsyncStorage.setItem(cle, blocs.join('BEGIN:VEVENT'));
    return `Cache altéré : ${rapport.join(', ')}. Rafraîchis le planning.`;
}
