// src/screens/ScheduleScreen.tsx

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { HyperplanningApi, ICalEvent } from '../lib/hyperplanning';

export default function ScheduleScreen() {
	const [events, setEvents] = useState<ICalEvent[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		loadSchedule();
	}, []);

	const loadSchedule = async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await HyperplanningApi.getClassAujourdhui('F1');
			setEvents(response.events);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Une erreur est survenue');
		} finally {
			setLoading(false);
		}
	};

	const formatTime = (date: Date) => {
		return date.toLocaleTimeString('fr-FR', {
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const renderEvent = ({ item }: { item: ICalEvent }) => (
		<View style={styles.eventCard}>
			<Text style={styles.eventTitle}>{item.summary}</Text>
			<Text style={styles.eventTime}>
				{formatTime(item.start)} - {formatTime(item.end)}
			</Text>
			<Text style={styles.eventLocation}>{item.location}</Text>
			{item.description && (
				<Text style={styles.eventDescription}>{item.description}</Text>
			)}
		</View>
	);

	if (loading) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	if (error) {
		return (
			<View style={styles.centered}>
				<Text style={styles.error}>{error}</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<FlatList
				data={events}
				renderItem={renderEvent}
				keyExtractor={(item, index) => `${item.start}-${index}`}
				contentContainerStyle={styles.list}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
	},
	centered: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	list: {
		padding: 16,
	},
	eventCard: {
		backgroundColor: 'white',
		padding: 16,
		borderRadius: 8,
		marginBottom: 12,
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	eventTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	eventTime: {
		fontSize: 14,
		color: '#666',
		marginBottom: 4,
	},
	eventLocation: {
		fontSize: 14,
		color: '#666',
		marginBottom: 4,
	},
	eventDescription: {
		fontSize: 14,
		color: '#444',
		marginTop: 8,
	},
	error: {
		color: 'red',
		textAlign: 'center',
		margin: 16,
	},
});