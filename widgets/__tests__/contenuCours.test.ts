import type { EvenementWidget } from '@/functions/widgetStore';
import { contenuCours } from '@/widgets/contenuCours';

/** Mercredi 2 septembre 2026, 8h-10h, en heure locale. */
function cours(over: Partial<EvenementWidget> = {}): EvenementWidget {
    return {
        summary: 'Algorithmique',
        start: '2026-09-02T08:00:00',
        end: '2026-09-02T10:00:00',
        location: 'IUTC-amphi 5',
        ...over,
    };
}

describe('contenuCours', () => {
    it('rend null quand aucun cours n\'est à venir', () => {
        expect(contenuCours(null)).toBeNull();
    });

    it('met en forme le titre, l\'horaire et la salle', () => {
        const c = contenuCours(cours(), new Date('2026-09-01T08:00:00'));

        expect(c?.titre).toBe('Algorithmique');
        expect(c?.horaire).toBe('mer. 2 sept. · 08:00 - 10:00');
        expect(c?.salle).toBe('IUTC-amphi 5');
    });

    it('remplace la salle absente plutôt que de laisser une ligne vide', () => {
        expect(contenuCours(cours({ location: '' }))?.salle).toBe('Salle non précisée');
    });

    it('signale un cours à venir comme pas encore commencé', () => {
        expect(contenuCours(cours(), new Date('2026-09-02T07:59:00'))?.enCours).toBe(false);
    });

    it('signale un cours commencé comme en cours', () => {
        expect(contenuCours(cours(), new Date('2026-09-02T09:00:00'))?.enCours).toBe(true);
    });

    it('bascule en cours dès l\'instant du début', () => {
        expect(contenuCours(cours(), new Date('2026-09-02T08:00:00'))?.enCours).toBe(true);
    });

    it('ne considère plus en cours un cours qui vient de finir', () => {
        expect(contenuCours(cours(), new Date('2026-09-02T10:00:00'))?.enCours).toBe(false);
    });
});
