import { useAuth } from '@/context/AuthContext';
import { ICalEvent } from '@/interfaces/IcalEvent';
import { incrementation_nb_requete } from "@/functions/supabase";
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { HyperplanningApi } from '@/functions/hyperplanning';

interface EdtContextType {
	allEvents: ICalEvent[];
	loading: boolean;
	error: string | null;
	selectedDate: dayjs.Dayjs;
	setSelectedDate: (date: dayjs.Dayjs) => void;
	refreshEdt: (groupe?: string) => void;
	getEventsForDate: (date: dayjs.Dayjs) => ICalEvent[];
	getCoursSuivant: () => ICalEvent | null;
}

const EdtContext = createContext<EdtContextType | undefined>(undefined);

interface EdtProviderProps {
	children: ReactNode;
}

export const EdtProvider = ({ children }: EdtProviderProps) => {
	const { user} = useAuth();
	const [allEvents, setAllEvents] = useState<ICalEvent[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedDate, setSelectedDate] = useState(dayjs().locale('fr'));

	// console.log('EdtProvider');

	const loadEdt = async (groupe?: string) => {

		try {
			setLoading(true);
			setError(null);
			// const userData = await recupDataUtilisateur();
			const userData = user;

			// console.log("userData : ", userData?.id);
			// await incrementation_nb_requete(userData?.id);
			if (groupe) {
				// console.log("Groupe : ", groupe);
				const response = await HyperplanningApi.getClass(groupe);
				setAllEvents(response.events);

			} else {
				if (userData?.group) {
					// console.log("Groupe : ", userData?.group);
					const response = await HyperplanningApi.getClass(userData.group);

					// fakeevent
					// let testEvent = { ...response.events[152] };
					// let futureDate = new Date();
					// futureDate.setMinutes(futureDate.getMinutes() + 16);
					// testEvent.start = futureDate;
					//
					// let futureEndDate = new Date(futureDate);
					// futureEndDate.setMinutes(futureEndDate.getMinutes() + 60);
					// testEvent.end = futureEndDate;
					// response.events.push(testEvent);
					//
					// // un deuxième mais dans 1h
					// let testEvent2 = { ...response.events[152] };
					// let futureDate2 = new Date();
					// futureDate2.setMinutes(futureDate2.getMinutes() + 60);
					// testEvent2.start = futureDate2;
					//
					// let futureEndDate2 = new Date(futureDate2);
					// futureEndDate2.setMinutes(futureEndDate2.getMinutes() + 60);
					// testEvent2.end = futureEndDate2;
					// response.events.push(testEvent2);

					setAllEvents(response.events);

				}
			}

		} catch (err) {
			setError(err instanceof Error ? err.message : 'Une erreur est survenue');
		} finally {
			setLoading(false);
		}
	};

	const getEventsForDate = (date: dayjs.Dayjs): ICalEvent[] => {
		return allEvents.filter(event => {
			const eventDate = dayjs(event.start);
			return eventDate.isSame(date, 'day');
		});
	};

	const getCoursSuivant = (): ICalEvent | null => {
		const now = dayjs();
		const events = allEvents.filter(event =>
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