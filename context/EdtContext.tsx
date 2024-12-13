import { useAuth } from '@/context/AuthContext';
import { ICalEvent } from '@/interfaces/IcalEvent';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { HyperplanningApi } from '@/functions/hyperplanning';

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

			if (groupe) {
				const response = await HyperplanningApi.getClass(groupe);
				setAllEvents(response.events);
			} else {
				if (userData?.group) {
					const response = await HyperplanningApi.getClass(userData.group);

					// Stocker les événements du groupe par défaut
					setDefaultGroupEvents(response.events);
					setAllEvents(response.events);
				}
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
		const events = defaultGroupEvents.filter(event =>
			dayjs(event.start).isAfter(now)
			||
			(dayjs(event.start).isBefore(now) && dayjs(event.end).isAfter(now))
		);
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