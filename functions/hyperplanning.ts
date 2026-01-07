import { ICalEvent } from "@/interfaces/IcalEvent";
import { fetchIcalEventsClass, fetchIcalEventsSalle } from "@/functions/hyperplanningIcal";


export interface EventsReponse {
	group?: string;
	salle?: string;
	count: number;
	events: ICalEvent[];
}

interface ApiError {
	error: string;
}

// Class HyperplanningApi
export class HyperplanningApi {

	static async enVie(): Promise<object> {
		return { status: "alive (local)" };
	}

	// Récupère l'emploi du temps d'une classe
	static async getClass(group: string): Promise<EventsReponse> {
		try {
			const events = await fetchIcalEventsClass(group);
			return {
				group: group,
				count: events.length,
				events: events
			};
		} catch (error) {
			console.error(error);
			throw new Error("Erreur lors de la récupération locale");
		}
	}

	static async getClassAPI(group: string): Promise<ICalEvent[]> {
		return fetchIcalEventsClass(group);
	}

	static async getSalleAPI(salle: string): Promise<ICalEvent[]> {
		return fetchIcalEventsSalle(salle);
	}

	// Récupère l'emploi du temps d'une salle
	static async getsalle(salle: string): Promise<EventsReponse> {
		try {
			const events = await fetchIcalEventsSalle(salle);
			return {
				salle: salle,
				count: events.length,
				events: events
			};
		} catch (error) {
			console.error(error);
			throw new Error("Erreur lors de la récupération locale");
		}
	}
}