import ICAL from 'ical.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import classInfoData from './utils/edtInfo.json';
import salleInfoData from './utils/salleInfo.json';

interface EdtInfoData {
	[key: string]: string;
}

interface IcalEvent {
	type: string;
	summary: string;
	description: string;
	start: Date;
	end: Date;
	location: string;
	[key: string]: any;
}

const baseUrl = "https://hplanning.univ-lehavre.fr/Telechargements/ical/";
const version = "2022.0.5.0";
const param = "643d5b312e2e36325d2666683d3126663d31";
const edtInfoDataClass: EdtInfoData = classInfoData;
const edtInfoDataSalle: EdtInfoData = salleInfoData;

async function fetchIcalEvents(edtInfo: string, isClass: boolean): Promise<IcalEvent[]> {
	const edtInfoData = isClass ? edtInfoDataClass : edtInfoDataSalle;
	const idICal = edtInfoData[edtInfo];
	const cacheKey = `ical_${isClass ? 'class' : 'salle'}_${edtInfo}`;

	if (!idICal && !edtInfo.startsWith('http')) {
		console.error(`Pas d'ID : ${edtInfo}`);
		return [];
	}

	const type = isClass ? 'INFO' : 'IUTC';
	
	let url = '';
	if (edtInfo.startsWith('http')) {
		url = edtInfo;
	} else {
		url = `${baseUrl}Edt_${type}_${edtInfo}.ics?version=${version}&idICal=${idICal}&param=${param}`;
	}

	try {
		const response = await fetch(url);
		if (!response.ok) throw new Error("Network response was not ok");
		
		const icsData = await response.text();
		
		// Sauvegarde dans le cache
		await AsyncStorage.setItem(cacheKey, icsData);

		return parseIcalData(icsData, edtInfo);

	} catch (error) {
		console.log(`Erreur fetch, tentative de chargement depuis le cache pour : ${edtInfo}`);
		try {
			const cachedData = await AsyncStorage.getItem(cacheKey);
			if (cachedData) {
				console.log(`Chargement depuis le cache pour ${edtInfo}`);
				return parseIcalData(cachedData, edtInfo);
			}
		} catch (cacheError) {
			console.error("Erreur lors de la lecture du cache", cacheError);
		}
		
		console.error(`Impossible de fetch l'edt et pas de cache : ${error}`);
		return [];
	}
}

function parseIcalData(icsData: string, edtInfo: string): IcalEvent[] {
	try {
		const jcalData = ICAL.parse(icsData);
		const component = new ICAL.Component(jcalData);
		const vevents = component.getAllSubcomponents('vevent');


		const events: IcalEvent[] = vevents.map((vevent: any) => {
			const event = new ICAL.Event(vevent);
			return {
				type: 'VEVENT',
				summary: event.summary,
				description: event.description,
				start: event.startDate.toJSDate(),
				end: event.endDate.toJSDate(),
				location: event.location,
			};
		});

		// sort
		events.sort((a, b) => {
			if (a.start < b.start) {
				return -1;
			}
			if (a.start > b.start) {
				return 1;
			}
			return 0;
		});

		console.log(`fetch ${events.length} pour ${edtInfo}`);
		return events;
	} catch (e) {
		console.error("Erreur parsing ICAL", e);
		return [];
	}
}

async function fetchIcalEventsClass(edtInfo: string): Promise<IcalEvent[]> {
	return fetchIcalEvents(edtInfo, true);
}

async function fetchIcalEventsSalle(edtInfo: string): Promise<IcalEvent[]> {
	return fetchIcalEvents(edtInfo, false);
}

export { fetchIcalEventsClass, fetchIcalEventsSalle };