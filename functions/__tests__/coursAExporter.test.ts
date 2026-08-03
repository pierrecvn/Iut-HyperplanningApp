import { coursAExporter, estExporteParNous, noteDuCours, SIGNATURE_EXPORT } from '@/functions/coursAExporter';
import { ICalEvent } from '@/interfaces/IcalEvent';

function evt(over: Partial<ICalEvent> & { start: Date }): ICalEvent {
    return {
        type: 'VEVENT',
        uid: 'a',
        sequence: null,
        summary: 'Algorithmique',
        description: 'TD groupe B1',
        location: 'IUTC-amphi 5',
        end: new Date(over.start.getTime() + 2 * 60 * 60 * 1000),
        ...over,
    };
}

const LUNDI = new Date(2026, 8, 7, 8, 0);
const MARDI = new Date(2026, 8, 8, 8, 0);
const MERCREDI = new Date(2026, 8, 9, 8, 0);

describe('coursAExporter', () => {
    it('ne garde que les cours de la période', () => {
        const r = coursAExporter(
            [evt({ start: LUNDI }), evt({ start: MARDI }), evt({ start: MERCREDI })],
            new Date(2026, 8, 8, 0, 0),
            new Date(2026, 8, 8, 23, 59, 59)
        );

        expect(r).toHaveLength(1);
        expect(r[0].start).toEqual(MARDI);
    });

    it('inclut les bornes', () => {
        const r = coursAExporter(
            [evt({ start: LUNDI }), evt({ start: MERCREDI })],
            LUNDI,
            MERCREDI
        );

        expect(r).toHaveLength(2);
    });

    it('trie par date de début', () => {
        const r = coursAExporter(
            [evt({ start: MERCREDI }), evt({ start: LUNDI }), evt({ start: MARDI })],
            LUNDI,
            MERCREDI
        );

        expect(r.map(e => e.start)).toEqual([LUNDI, MARDI, MERCREDI]);
    });

    it('rend une liste vide plutôt que de lever quand la période ne contient rien', () => {
        expect(coursAExporter([evt({ start: LUNDI })], MARDI, MERCREDI)).toEqual([]);
    });
});

describe('noteDuCours', () => {
    it('conserve la description du cours et la signe', () => {
        const note = noteDuCours(evt({ start: LUNDI }));

        expect(note).toContain('TD groupe B1');
        expect(note).toContain(SIGNATURE_EXPORT);
    });

    it('ne laisse pas de blanc en tête quand le cours n\'a pas de description', () => {
        expect(noteDuCours(evt({ start: LUNDI, description: '' }))).toBe(SIGNATURE_EXPORT);
    });
});

describe('estExporteParNous', () => {
    it('reconnaît un événement que nous avons écrit', () => {
        expect(estExporteParNous(noteDuCours(evt({ start: LUNDI })))).toBe(true);
    });

    it('épargne un événement ajouté à la main par l\'utilisateur', () => {
        expect(estExporteParNous('Rendez-vous dentiste')).toBe(false);
        expect(estExporteParNous(null)).toBe(false);
        expect(estExporteParNous(undefined)).toBe(false);
    });
});
