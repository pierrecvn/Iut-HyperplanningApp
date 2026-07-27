import { CalendarService, CustomCalendar } from '@/functions/calendarService';
import { useCallback, useEffect, useState } from 'react';

/**
 * État partagé de la liste des calendriers personnalisés.
 *
 * Deux fonctionnalités des paramètres en dépendent sans se connaître :
 * le gestionnaire de calendriers, et la sélection de groupe — qui ajoute
 * automatiquement le groupe choisi comme calendrier pour qu'il apparaisse
 * dans la vue combinée, et qui lit la liste pour afficher le suffixe
 * « (Perso) ».
 *
 * Les mutations rechargent la liste mais ne déclenchent PAS refreshEdt() :
 * les appelants actuels ne le font pas tous, et ce hook préserve leur
 * comportement à l'identique. À chacun d'appeler refreshEdt() s'il le doit.
 */
export function useCalendars() {
    const [calendars, setCalendars] = useState<CustomCalendar[]>([]);

    const reload = useCallback(() => {
        setCalendars(CalendarService.getCalendars());
    }, []);

    useEffect(() => {
        reload();
    }, [reload]);

    const add = useCallback((calendar: Omit<CustomCalendar, 'id'>) => {
        const created = CalendarService.addCalendar(calendar);
        reload();
        return created;
    }, [reload]);

    const remove = useCallback((id: string) => {
        CalendarService.deleteCalendar(id);
        reload();
    }, [reload]);

    const toggle = useCallback((id: string) => {
        CalendarService.toggleCalendar(id);
        reload();
    }, [reload]);

    /** Retrouve un calendrier par son URL — utilisé pour l'affichage du groupe. */
    const findByUrl = useCallback(
        (url: string) => calendars.find(c => c.url === url),
        [calendars]
    );

    return { calendars, reload, add, remove, toggle, findByUrl };
}
