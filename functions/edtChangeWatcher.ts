import { ChangementEdt } from '@/functions/edtDiff';

/**
 * Point de rendez-vous entre la couche de récupération et celle qui notifie.
 *
 * hyperplanningIcal détecte les changements au moment où il a les deux
 * versions sous la main, mais n'a aucune raison de connaître les
 * notifications. Il les annonce ici ; qui veut s'y abonne.
 */

type Ecouteur = (changements: ChangementEdt[], source: string) => void;

let ecouteur: Ecouteur | null = null;

/** Un seul écouteur à la fois — passer null se désabonne. */
export function surChangementEdt(nouvelEcouteur: Ecouteur | null): void {
    ecouteur = nouvelEcouteur;
}

export function signalerChangements(changements: ChangementEdt[], source: string): void {
    if (changements.length === 0 || !ecouteur) return;

    try {
        ecouteur(changements, source);
    } catch (error) {
        // Un écouteur défaillant ne doit jamais faire échouer la récupération
        // de l'emploi du temps, qui est la fonction principale de l'app.
        console.error('Erreur dans l\'écouteur de changements EDT', error);
    }
}
