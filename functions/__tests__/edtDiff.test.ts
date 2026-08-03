import { comparerEdt } from '@/functions/edtDiff';
import { ICalEvent } from '@/interfaces/IcalEvent';

const MAINTENANT = new Date('2026-09-01T08:00:00Z');

/** Fabrique un événement à venir, avec des valeurs par défaut raisonnables. */
function evt(over: Partial<ICalEvent> & { uid: string }): ICalEvent {
    return {
        type: 'VEVENT',
        sequence: null,
        summary: 'Algorithmique',
        description: '',
        location: 'IUTC-amphi 5',
        start: new Date('2026-09-02T08:00:00Z'),
        end: new Date('2026-09-02T10:00:00Z'),
        ...over,
    };
}

describe('comparerEdt', () => {
    it('ne signale rien quand rien ne change', () => {
        const edt = [evt({ uid: 'a' }), evt({ uid: 'b' })];
        expect(comparerEdt(edt, edt, MAINTENANT)).toEqual([]);
    });

    it('détecte un cours ajouté', () => {
        const avant = [evt({ uid: 'a' })];
        const apres = [evt({ uid: 'a' }), evt({ uid: 'b', summary: 'Réseaux' })];

        const r = comparerEdt(avant, apres, MAINTENANT);

        expect(r).toHaveLength(1);
        expect(r[0].type).toBe('ajoute');
        expect(r[0].event.summary).toBe('Réseaux');
    });

    it('détecte un cours supprimé', () => {
        const r = comparerEdt([evt({ uid: 'a' }), evt({ uid: 'b' })], [evt({ uid: 'a' })], MAINTENANT);

        expect(r).toHaveLength(1);
        expect(r[0].type).toBe('supprime');
        expect(r[0].event.uid).toBe('b');
    });

    it('détecte un déplacement horaire', () => {
        const avant = [evt({ uid: 'a' })];
        const apres = [evt({
            uid: 'a',
            start: new Date('2026-09-02T14:00:00Z'),
            end: new Date('2026-09-02T16:00:00Z'),
        })];

        const r = comparerEdt(avant, apres, MAINTENANT);

        expect(r).toHaveLength(1);
        expect(r[0].type).toBe('deplace');
        if (r[0].type === 'deplace') {
            expect(r[0].avantStart).toEqual(new Date('2026-09-02T08:00:00Z'));
        }
    });

    it('détecte un changement de salle', () => {
        const avant = [evt({ uid: 'a', location: 'IUTC-amphi 5' })];
        const apres = [evt({ uid: 'a', location: 'IUTC-salle 12' })];

        const r = comparerEdt(avant, apres, MAINTENANT);

        expect(r).toHaveLength(1);
        expect(r[0].type).toBe('salle');
        if (r[0].type === 'salle') {
            expect(r[0].avantLocation).toBe('IUTC-amphi 5');
        }
    });

    it('ignore un simple réordonnancement des salles multiples', () => {
        // Hyperplanning ne garantit pas l'ordre quand un cours occupe
        // plusieurs salles : sans normalisation, ce serait un faux positif.
        const avant = [evt({ uid: 'a', location: 'Salle B, Salle A' })];
        const apres = [evt({ uid: 'a', location: 'Salle A,  Salle B' })];

        expect(comparerEdt(avant, apres, MAINTENANT)).toEqual([]);
    });

    it('signale une annulation plutôt que le changement de titre qui la porte', () => {
        // Hyperplanning n'émet pas STATUS:CANCELLED : il préfixe l'intitulé.
        const avant = [evt({ uid: 'a', summary: 'Algorithmique' })];
        const apres = [evt({ uid: 'a', summary: 'Cours annulé - Algorithmique' })];

        const r = comparerEdt(avant, apres, MAINTENANT);

        expect(r).toHaveLength(1);
        expect(r[0].type).toBe('annule');
    });

    it('ne resignale pas un cours déjà annulé au tour précédent', () => {
        const dejaAnnule = [evt({ uid: 'a', summary: 'Cours annulé - Algorithmique' })];
        expect(comparerEdt(dejaAnnule, dejaAnnule, MAINTENANT)).toEqual([]);
    });

    it('ignore les cours passés qui sortent de la fenêtre du flux', () => {
        // La fenêtre Hyperplanning glisse : sans ce filtre, chaque cours qui en
        // sort serait annoncé comme une suppression.
        const passe = evt({
            uid: 'vieux',
            start: new Date('2026-08-01T08:00:00Z'),
            end: new Date('2026-08-01T10:00:00Z'),
        });

        expect(comparerEdt([passe, evt({ uid: 'a' })], [evt({ uid: 'a' })], MAINTENANT)).toEqual([]);
    });

    it('ignore les événements sans UID', () => {
        // Sans clé de rapprochement fiable, mieux vaut manquer un changement
        // que d'en inventer un.
        const sansUid = { ...evt({ uid: 'x' }), uid: null };

        expect(comparerEdt([sansUid], [], MAINTENANT)).toEqual([]);
        expect(comparerEdt([], [sansUid], MAINTENANT)).toEqual([]);
    });

    it('trie les changements par date de début', () => {
        const avant: ICalEvent[] = [];
        const apres = [
            evt({ uid: 'tard', start: new Date('2026-09-05T08:00:00Z'), end: new Date('2026-09-05T10:00:00Z') }),
            evt({ uid: 'tot', start: new Date('2026-09-02T08:00:00Z'), end: new Date('2026-09-02T10:00:00Z') }),
        ];

        const r = comparerEdt(avant, apres, MAINTENANT);

        expect(r.map(c => c.event.uid)).toEqual(['tot', 'tard']);
    });

    it('ne signale rien quand on compare le cache à lui-même', () => {
        // Cas réel : quand le fetch échoue, hyperplanningIcal relit le cache.
        // Ancien et nouveau sont alors le même contenu.
        const edt = [evt({ uid: 'a' }), evt({ uid: 'b' })];
        expect(comparerEdt(edt, [...edt], MAINTENANT)).toEqual([]);
    });
});
