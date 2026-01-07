import { useAuth } from '@/context/AuthContext';
import { ICalEvent } from '@/interfaces/IcalEvent';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { HyperplanningApi } from '@/functions/hyperplanning';
import { CalendarService } from '@/functions/calendarService';

interface EdtContextType {
	allEvents: ICalEvent[];
	defaultGroupEvents: ICalEvent[];
	loading: boolean;
	error: string | null;
	selectedDate: dayjs.Dayjs;
	setSelectedDate: (date: dayjs.Dayjs) => void;
	refreshEdt: (groupe?: string) => void;
	getEventsForDate: (date: dayjs.Dayjs, groupe?: string) => ICalEvent[];
	getCoursSuivant: () => ICalEvent | null;
}

const EdtContext = createContext<EdtContextType | undefined>(undefined);

interface EdtProviderProps {
	children: ReactNode;
}

export const EdtProvider = ({ children }: EdtProviderProps) => {
	const { user } = useAuth();
	const [allEvents, setAllEvents] = useState<ICalEvent[]>([]);
	const [defaultGroupEvents, setDefaultGroupEvents] = useState<ICalEvent[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedDate, setSelectedDate] = useState(dayjs().locale('fr'));

	const loadEdt = async (groupe?: string) => {
		try {
			setLoading(true);
			setError(null);
			const userData = user;
            
            // Le groupe actif : soit celui passé en param (preview), soit celui de l'utilisateur
            // Si 'groupe' est fourni, c'est une preview temporaire qui ne doit pas affecter les notifs
            const isPreview = !!groupe;
            const activeGroup = groupe || userData?.group;

			let mergedEvents: ICalEvent[] = [];

            // Cas 1: Vue Combinée (Merged View)
            if (activeGroup === 'merged_view') {
                // On charge TOUS les calendriers activés
                 const customCalendars = CalendarService.getCalendars().filter(c => c.enabled);
                 
                 const promises = customCalendars.map(async (calendar) => {
                     try {
                        const response = await HyperplanningApi.getClass(calendar.url);
                        return response.events.map(evt => ({
                            ...evt,
                            color: calendar.color,
                            sourceName: calendar.name
                        }));
                     } catch(e) { 
                        console.error(`Erreur load ${calendar.name}`, e);
                        return []; 
                     }
                 });

                 const results = await Promise.all(promises);
                 results.forEach(evts => mergedEvents.push(...evts));
            
            } else if (activeGroup) {
                // Cas 2: Vue Individuelle (Focus sur un calendrier spécifique)
                const response = await HyperplanningApi.getClass(activeGroup);
                
                // On essaie de trouver la couleur associée si elle existe dans mes calendriers
                const linkedCal = CalendarService.getCalendars().find(c => c.url === activeGroup);
                
                mergedEvents = response.events.map(evt => ({
                    ...evt,
                    color: linkedCal?.color, 
                    sourceName: linkedCal?.name
                }));
            }
            
            // Mise à jour des états
            setAllEvents(mergedEvents);
            
            // On ne met à jour les événements par défaut (et donc les notifs) QUE si ce n'est pas une preview temporaire
            if (!isPreview) {
                setDefaultGroupEvents(mergedEvents);
            }

		} catch (err) {
			setError(err instanceof Error ? err.message : 'Une erreur est survenue');
		} finally {
			setLoading(false);
		}
	};

	const getEventsForDate = (date: dayjs.Dayjs, groupe?: string): ICalEvent[] => {		
		const eventsToFilter = groupe ? defaultGroupEvents : allEvents;

		return eventsToFilter.filter(event => {
			const eventDate = dayjs(event.start);
			const isOnDate = eventDate.isSame(date, 'day');
			return isOnDate;
		});
	};

	const getCoursSuivant = (): ICalEvent | null => {
		const now = dayjs();

		const events = allEvents.filter(event =>
			dayjs(event.start).isAfter(now)
			||
			(dayjs(event.start).isBefore(now) && dayjs(event.end).isAfter(now))
		);
		
		// Tri par date de début
		events.sort((a, b) => dayjs(a.start).valueOf() - dayjs(b.start).valueOf());

		if (events.length === 0) return null;
		return events[0];
	}

	useEffect(() => {
		loadEdt()
	}, [user]);

	const value = {
		allEvents,
		defaultGroupEvents,
		loading,
		error,
		selectedDate,
		setSelectedDate,
		refreshEdt: loadEdt,
		getEventsForDate,
		getCoursSuivant
	};

	return (
		<EdtContext.Provider value={value}>
			{children}
		</EdtContext.Provider>
	);
};

export const useEdt = () => {
	const context = useContext(EdtContext);
	if (context === undefined) {
		throw new Error('useEdt must be used within a EdtProvider');
	}
	return context;
};