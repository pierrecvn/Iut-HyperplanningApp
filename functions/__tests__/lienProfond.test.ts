import { lienPlanning } from '@/functions/lienProfond';

describe('lienPlanning', () => {
    it('ouvre le planning sans jour quand aucune date n\'est fournie', () => {
        expect(lienPlanning()).toBe('iuthyperplanningapp://planning');
        expect(lienPlanning(null)).toBe('iuthyperplanningapp://planning');
    });

    it('porte le jour du cours en paramètre', () => {
        expect(lienPlanning(new Date(2026, 7, 17, 14, 30))).toBe(
            'iuthyperplanningapp://planning?date=2026-08-17'
        );
    });

    it('accepte la date sous forme de chaîne ISO, comme elle est stockée', () => {
        expect(lienPlanning('2026-08-17T12:00:00')).toBe(
            'iuthyperplanningapp://planning?date=2026-08-17'
        );
    });

    it('complète les mois et jours sur deux chiffres', () => {
        expect(lienPlanning(new Date(2026, 0, 5, 9, 0))).toBe(
            'iuthyperplanningapp://planning?date=2026-01-05'
        );
    });

    it('retient le jour local et non le jour UTC', () => {
        // Un cours de fin de journée bascule de jour en UTC selon le fuseau ;
        // l'écran de planning raisonne en local, le lien doit faire pareil.
        const finDeJournee = new Date(2026, 7, 17, 23, 30);
        expect(lienPlanning(finDeJournee)).toBe('iuthyperplanningapp://planning?date=2026-08-17');
    });

    it('retombe sur le planning nu plutôt que sur un lien mort si la date est illisible', () => {
        expect(lienPlanning('pas une date')).toBe('iuthyperplanningapp://planning');
    });
});
