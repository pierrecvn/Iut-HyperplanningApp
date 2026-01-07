export interface ICalEvent {
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
