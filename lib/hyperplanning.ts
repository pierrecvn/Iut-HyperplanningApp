export interface ICalEvent {
	type: string;
	summary: string;
	description: string;
	start: Date;
	end: Date;
	location: string;
}

interface EventsReponse {
	group?: string;
	salle?: string;
	count: number;
	events: ICalEvent[];
}

interface ApiError {
	error: string;
}


const API_BASE_URL = 'https://api.sajima.fr/hyperplanning';

const ApiError = (error: any): never => {
	if (error.response) {
		throw new Error(error.response.data?.error || 'Erreur serveur');
	}
	throw new Error('Erreur réseau');
};

// Class HyperplanningApi
export class HyperplanningApi {

	static async enVie(): Promise<object> {
		try {
			const response = await fetch(`${API_BASE_URL}/envie`);
			const data = await response.json();
			return data;
		} catch (error) {
			return ApiError(error);
		}
	}

	// Récupère l'emploi du temps d'une classe
	static async getClass(group: string): Promise<EventsReponse> {
		try {
			const response = await fetch(`${API_BASE_URL}/class/${group}`);
			if (!response.ok) {
				const errorData: ApiError = await response.json();
				throw new Error(errorData.error);
			}
			const data: EventsReponse = await response.json();

			// Conversion des dates string en objets Date
			data.events = data.events.map(event => ({
				...event,
				start: new Date(event.start),
				end: new Date(event.end)
			}));

			return data;
		} catch (error) {
			return ApiError(error);
		}
	}

	// Récupère l'emploi du temps d'une salle
	static async getsalle(salle: string): Promise<EventsReponse> {
		try {
			const response = await fetch(`${API_BASE_URL}/salle/${salle}`);
			if (!response.ok) {
				const errorData: ApiError = await response.json();
				throw new Error(errorData.error);
			}
			const data: EventsReponse = await response.json();

			// Conversion des dates string en objets Date
			data.events = data.events.map(event => ({
				...event,
				start: new Date(event.start),
				end: new Date(event.end)
			}));

			return data;
		} catch (error) {
			return ApiError(error);
		}
	}

	// Récupère les événements du jour depuis l'emploi du temps global
	static async getClassAujourdhui(group: string): Promise<EventsReponse> {
		try {
			const response = await this.getClass(group);
			const ajd = new Date();
			const events = response.events.filter(event => {

				return event.start.getDate() === ajd.getDate()
					&& event.start.getMonth() === ajd.getMonth()
					&& event.start.getFullYear() === ajd.getFullYear();
			});
			return { ...response, events };

		} catch (error) {
			return ApiError(error);
		}
	}
}