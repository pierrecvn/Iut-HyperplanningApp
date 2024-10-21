import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { fetchIcalEventsClass } from '../lib/hyperplanning';

interface IcalEvent {
	type: string;
	summary: string;
	description: string;
	start: Date;
	end: Date;
	location: string;
}


const formaterDate = (date: Date) => date.toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Paris' });


const EventList = () => {
	const [events, setEvents] = useState<IcalEvent[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {

		const fetchEvents = async () => {
			try {
				const fetchedEvents = await fetchIcalEventsClass('F1');
				setEvents(fetchedEvents);
			} catch (err) {
				setError('Erreur lors du fetch des événements');
			} finally {
				setLoading(false);
			}
		};

		fetchEvents();
	}, []);

	if (loading) {
		return <ActivityIndicator size="large" color="#0000ff" />;
	}

	if (error) {
		return <Text>{error}</Text>;
	}

	return (
		<View style={styles.container}>
			<FlatList
				data={events}
				keyExtractor={(item, index) => index.toString()}
				renderItem={({ item }) => (
					<View style={styles.eventItem}>
						<Text style={styles.summary}>{item.summary}</Text>
						<Text>
							{formaterDate(item.start)} - {formaterDate(item.end)}
						</Text>
						<Text>Location: {item.location}</Text>
					</View>
				)}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 10,
		backgroundColor: '#fff',
	},
	eventItem: {
		padding: 10,
		marginVertical: 5,
		borderColor: '#ddd',
		borderWidth: 1,
		borderRadius: 5,
		backgroundColor: '#f9f9f9',
	},
	summary: {
		fontWeight: 'bold',
		fontSize: 16,
		marginBottom: 5,
	},
});

export default EventList;
