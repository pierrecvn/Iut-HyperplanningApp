import { coursAExporter, estExporteParNous, noteDuCours } from '@/functions/coursAExporter';
import type { ICalEvent } from '@/interfaces/IcalEvent';
import * as Calendar from 'expo-calendar';

/**
 * Écriture de l'emploi du temps dans l'agenda de l'appareil.
 *
 * L'application possède son propre calendrier, créé au premier export. Écrire
 * dans un calendrier existant aurait mêlé les cours aux événements personnels
 * de l'utilisateur, sans moyen de revenir en arrière ; là, il lui suffit de
 * décocher ou supprimer ce calendrier pour tout retirer d'un geste.
 *
 * C'est un calendrier local, non synchronisé vers un compte distant : rien de
 * l'emploi du temps ne part chez Google. En contrepartie il ne suit pas
 * l'utilisateur d'un appareil à l'autre.
 *
 * L'export est idempotent. Ré-exporter la même période efface d'abord les
 * cours qu'on y avait écrits — reconnus à leur signature — puis les récrit.
 * Un cours annulé disparaît donc, un cours déplacé se retrouve au bon endroit,
 * et rien ne se duplique. Les événements que l'utilisateur aurait ajoutés
 * lui-même dans ce calendrier sont épargnés.
 */

const TITRE_CALENDRIER = 'IUT — Mon planning';

/** Nom du compte local propriétaire. Visible dans certaines applications d'agenda. */
const COMPTE = 'Iut-HyperplanningApp';

export type ResultatExport = {
    /** Cours écrits. */
    ecrits: number;
    /** Anciens cours retirés avant réécriture. */
    remplaces: number;
};

/** L'utilisateur a refusé l'accès à l'agenda. Cas normal, pas une panne. */
export class PermissionAgendaRefusee extends Error {
    constructor() {
        super("L'accès à l'agenda a été refusé.");
        this.name = 'PermissionAgendaRefusee';
    }
}

async function calendrierDeLApplication(): Promise<Calendar.ExpoCalendar> {
    const existants = await Calendar.getCalendars();
    const notre = existants.find(c => c.title === TITRE_CALENDRIER);
    if (notre) return notre;

    return Calendar.createCalendar({
        title: TITRE_CALENDRIER,
        name: TITRE_CALENDRIER,
        color: '#FC9219',
        accessLevel: Calendar.CalendarAccessLevel.OWNER,
        ownerAccount: COMPTE,
        // isLocalAccount : le calendrier vit sur l'appareil, sans compte de
        // synchronisation. Sans ça, Android supprime un calendrier dont le
        // compte déclaré n'existe pas.
        source: { isLocalAccount: true, name: COMPTE, type: '' },
    });
}

/**
 * Exporte les cours d'une période. Les bornes sont prises telles quelles :
 * c'est à l'appelant de les étendre au jour entier s'il le souhaite.
 */
export async function exporterVersAgenda(
    events: ICalEvent[],
    debut: Date,
    fin: Date
): Promise<ResultatExport> {
    const permission = await Calendar.requestCalendarPermissions();
    if (!permission.granted) throw new PermissionAgendaRefusee();

    const calendrier = await calendrierDeLApplication();

    const dejaPresents = await calendrier.listEvents(debut, fin);
    const aRemplacer = dejaPresents.filter(e => estExporteParNous(e.notes));

    for (const ancien of aRemplacer) {
        await ancien.delete();
    }

    const cours = coursAExporter(events, debut, fin);

    for (const c of cours) {
        await calendrier.createEvent({
            title: c.summary,
            startDate: c.start,
            endDate: c.end,
            location: c.location || undefined,
            notes: noteDuCours(c),
        });
    }

    return { ecrits: cours.length, remplaces: aRemplacer.length };
}
