export interface ICalEvent {
	/** UID iCal, identifiant stable côté serveur. `null` si le flux l'omet. */
	uid?: string | null;
	/** Numéro de révision iCal, incrémenté par le serveur à chaque modification. */
	sequence?: number | null;
	type: string;
	summary: string;
	description: string;
	start: Date;
	end: Date;
	location: string;
	color?: string;
	sourceName?: string;
	[key: string]: any;
}
