import { useAuth } from '@/context/AuthContext';
import { useEdt } from '@/context/EdtContext';
import { ICalEvent } from '@/interfaces/IcalEvent';
import dayjs from 'dayjs';
import { useMemo } from 'react';

/** Une pause insérée entre deux cours éloignés de plus de 75 minutes. */
export type PauseMidi = {
    type: 'break';
    start: Date;
    end: Date;
    duration: number;
};

const DUREE_MIN_PAUSE = 75;

type Options = {
    /** "all" ou un nombre d'événements à venir sous forme de chaîne. */
    nb?: string;
    /** Affiche le jour courant plutôt que la date sélectionnée. */
    estUnique?: boolean;
    /** Liste fournie de l'extérieur, filtrée sur la date sélectionnée. */
    data?: ICalEvent[];
};

/**
 * Prépare les événements à afficher : sélection, insertion des pauses midi
 * et statistiques de la journée.
 *
 * Les trois calculs s'enchaînent — les pauses et les stats dérivent de la
 * liste filtrée — d'où leur regroupement dans un seul hook plutôt que
 * trois appels indépendants.
 */
export function useEventsAffichage({ nb = 'all', estUnique = false, data }: Options) {
    const { getEventsForDate, selectedDate } = useEdt();
    const { user } = useAuth();

    const events = useMemo(() => {
        let listEvents: ICalEvent[] = [];

        if (data) {
            listEvents = data.filter(event => dayjs(event.start).isSame(selectedDate, 'day'));
        } else {
            const dateToUse = estUnique ? dayjs() : selectedDate;
            listEvents = estUnique
                ? getEventsForDate(dateToUse, user?.group)
                : getEventsForDate(dateToUse);
        }

        if (nb === 'all') return listEvents;

        const now = dayjs();
        const upcomingEvents = listEvents.filter(event =>
            dayjs(event.start).isAfter(now) ||
            (dayjs(event.start).isBefore(now) && dayjs(event.end).isAfter(now))
        );

        upcomingEvents.sort((a, b) => dayjs(a.start).valueOf() - dayjs(b.start).valueOf());

        const count = parseInt(nb);
        return isNaN(count) ? listEvents : upcomingEvents.slice(0, count);
        // NOTE : la dépendance conditionnelle `estUnique ? null : selectedDate`
        // est reprise telle quelle de l'original. React attend un tableau de
        // dépendances stable ; à revoir séparément, la corriger changerait la
        // mémoïsation.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getEventsForDate, estUnique ? null : selectedDate, nb, user?.group, data]);

    /** Insère une pause entre deux cours séparés de plus de 75 minutes. */
    const eventsAvecPauseMidi = useMemo(() => {
        const eventsWithBreakInfo: (ICalEvent | PauseMidi)[] = [];

        for (let i = 0; i < events.length; i++) {
            eventsWithBreakInfo.push(events[i]);

            if (i < events.length - 1) {
                const currentEventEnd = dayjs(events[i].end);
                const nextEventStart = dayjs(events[i + 1].start);
                const breakDuration = nextEventStart.diff(currentEventEnd, 'minute');

                if (breakDuration > DUREE_MIN_PAUSE) {
                    eventsWithBreakInfo.push({
                        type: 'break',
                        start: currentEventEnd.toDate(),
                        end: nextEventStart.toDate(),
                        duration: breakDuration
                    });
                }
            }
        }

        return eventsWithBreakInfo;
    }, [events]);

    const courseDayStats = useMemo(() => {
        if (events.length === 0) return null;

        const firstEvent = dayjs(events[0].start);
        const lastEvent = dayjs(events[events.length - 1].end);
        const now = dayjs();

        const totalCourseDuration = lastEvent.diff(firstEvent, 'minute');
        const remainingTime = lastEvent.diff(now, 'minute');

        return {
            startTime: firstEvent,
            endTime: lastEvent,
            totalDuration: totalCourseDuration,
            remainingTime: remainingTime > 0 ? remainingTime : 0
        };
    }, [events]);

    return { events, eventsAvecPauseMidi, courseDayStats };
}
