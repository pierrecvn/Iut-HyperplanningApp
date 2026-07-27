import { ICalEvent } from '@/interfaces/IcalEvent';
import dayjs from 'dayjs';

export type EventStatus = {
    status: string;
    timeText: string;
    color: string;
    icon: string;
};

/** Temps restant avant une date, ou null si elle est passée. */
export const getTimeRemaining = (date: Date): string | null => {
    const now = dayjs();
    const target = dayjs(date);
    const diff = target.diff(now, 'minute');

    if (diff < 0) return null;

    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;

    return hours > 0
        ? `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`
        : `${minutes}min`;
};

export const getEventDuration = (start: Date, end: Date) => {
    const duration = dayjs(end).diff(dayjs(start), 'minute');
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    return {
        hours,
        minutes,
        formatted: `${hours}h${minutes > 0 ? `${minutes}` : ''}`
    };
};

export const isCancelled = (event: ICalEvent): boolean => {
    return event.summary.toLowerCase().startsWith('cours annulé');
};

/**
 * Statut d'affichage d'un événement selon l'heure courante.
 *
 * Les couleurs du thème sont passées en argument plutôt que lues d'un
 * contexte : la fonction reste pure, donc testable sans rendu.
 */
export const getEventStatus = (
    event: ICalEvent,
    colors: { primary?: string; danger?: string }
): EventStatus => {
    if (isCancelled(event)) {
        return {
            status: 'close-circle',
            timeText: 'Cours annulé',
            color: `${colors.danger}`,
            icon: 'close-circle'
        };
    }

    const now = dayjs();
    const start = dayjs(event.start);
    const end = dayjs(event.end);
    const eventColor = event.color || colors.primary || '#000000';

    if (now.isBefore(start)) {
        return {
            status: 'upcoming',
            timeText: `Commence dans ${getTimeRemaining(event.start)}`,
            color: eventColor,
            icon: 'chevron-down'
        };
    }

    if (now.isAfter(end)) {
        return {
            status: 'finished',
            timeText: 'Terminé',
            color: '#757575',
            icon: 'file-tray-outline'
        };
    }

    return {
        status: 'ongoing',
        timeText: `Se termine dans ${getTimeRemaining(event.end)}`,
        // Le vert marque l'état actif, indépendamment de la couleur du cours.
        color: '#4CAF50',
        icon: 'alarm-outline'
    };
};
