export interface ICalEvent {
	type: string;
	summary: string;
	description: string;
	start: Date;
	end: Date;
	location: string;
}
