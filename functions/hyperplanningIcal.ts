import ICAL from 'ical.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import classInfoData from './utils/edtInfo.json';
import salleInfoData from './utils/salleInfo.json';
import { comparerEdt } from '@/functions/edtDiff';
import { signalerChangements } from '@/functions/edtChangeWatcher';

interface EdtInfoData {
	[key: string]: string;
}

interface IcalEvent {
	type: string;
	/** UID iCal de l'événement. Identifiant stable côté serveur, absent si le flux l'omet. */
	uid: string | null;
	/** Numéro de révision iCal. Incrémenté par le serveur à chaque modification. */
	sequence: number | null;
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

/** Clé du cache AsyncStorage pour un emploi du temps donné. */
export function cleCache(edtInfo: string, isClass: boolean): string {
	return `ical_${isClass ? 'class' : 'salle'}_${edtInfo}`;
}

async function fetchIcalEvents(edtInfo: string, isClass: boolean): Promise<IcalEvent[]> {
	const edtInfoData = isClass ? edtInfoDataClass : edtInfoDataSalle;
	const idICal = edtInfoData[edtInfo];
	const cacheKey = cleCache(edtInfo, isClass);

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

		// Un HTTP 200 ne garantit pas un iCal : une page de maintenance
		// écraserait le cache, le parsing rendrait zéro événement, et la
		// comparaison conclurait que tous les cours ont été supprimés.
		// On bascule alors sur le cache via le catch ci-dessous.
		if (!icsData.includes('BEGIN:VCALENDAR')) {
			throw new Error("Réponse sans contenu iCal");
		}

		const nouveauxEvents = parseIcalData(icsData, edtInfo);

		// Comparaison AVANT écrasement du cache : c'est le seul moment où
		// l'ancienne et la nouvelle version coexistent.
		const ancienIcs = await AsyncStorage.getItem(cacheKey);
		if (ancienIcs) {
			const anciensEvents = parseIcalData(ancienIcs, edtInfo);

			// Un fichier tronqué passe le test BEGIN:VCALENDAR mais casse le
			// parsing, qui renvoie alors un tableau vide. Sans cette garde, on
			// annoncerait l'annulation de tout l'emploi du temps.
			const reponseSuspecte = nouveauxEvents.length === 0 && anciensEvents.length > 0;

			if (reponseSuspecte) {
				console.warn(`Réponse vide alors que le cache contient ${anciensEvents.length} cours pour ${edtInfo} : cache conservé`);
				return anciensEvents;
			}

			signalerChangements(comparerEdt(anciensEvents, nouveauxEvents), edtInfo);
		}

		// Sauvegarde dans le cache
		await AsyncStorage.setItem(cacheKey, icsData);

		return nouveauxEvents;

	} catch (error) {
		// Pas de comparaison sur ce chemin : on relit le cache, donc l'ancien
		// et le nouveau seraient le même contenu et le diff toujours vide.
		console.log(`Erreur fetch (${(error as Error)?.message ?? error}), tentative de chargement depuis le cache pour : ${edtInfo}`);
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
				// Conservés pour pouvoir comparer deux versions de l'emploi du
				// temps : sans identifiant stable, un cours déplacé se lit comme
				// une suppression suivie d'une création, et on ne peut ni
				// notifier « changement d'horaire » ni mettre à jour un
				// événement déjà exporté vers l'agenda.
				// ical.js renvoie null quand la propriété est absente du flux.
				uid: event.uid ?? null,
				sequence: event.sequence ?? null,
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