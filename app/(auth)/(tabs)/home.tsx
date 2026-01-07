import { useEdt } from '@/context/EdtContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useHeaderHeight } from '@react-navigation/elements';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import relativeTime from 'dayjs/plugin/relativeTime';
import EventList from "@/components/EventList";
import { router } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import TutorialModal from '@/components/TutorialModal';
import { Ionicons } from '@expo/vector-icons';

dayjs.extend(relativeTime);
dayjs.locale('fr');

const Page = () => {
	const insets = useSafeAreaInsets();
	const headerHeight = useHeaderHeight() - insets.top;
	const BOTTOM_PADDING = useBottomTabBarHeight() - useSafeAreaInsets().bottom;
	const { theme } = useTheme();
	const { getCoursSuivant, setSelectedDate } = useEdt();
	const [showTutorial, setShowTutorial] = useState(false);

	useEffect(() => {
		const checkTutorial = async () => {
			try {
				const hasSeen = await AsyncStorage.getItem('HAS_SEEN_SWIPE_TUTORIAL');
				if (hasSeen !== 'true') {
					setTimeout(() => setShowTutorial(true), 1000);
				}
			} catch (e) {
				console.error("Erreur lecture tuto", e);
			}
		};
		checkTutorial();
	}, []);

	const handleCloseTutorial = async () => {
		setShowTutorial(false);
		await AsyncStorage.setItem('HAS_SEEN_SWIPE_TUTORIAL', 'true');
	};

	const nextEvent = getCoursSuivant();

	const formatHeure = (date: string | number | dayjs.Dayjs | Date | null | undefined) => {
		return dayjs(date).format('HH:mm');
	};

	const renderEventInfo = () => {
		if (!nextEvent) {
			return (
				<View style={[styles.eventInfoContainer, { backgroundColor: theme.bg.alarme, shadowColor: theme.text.base }]}>
					<View style={styles.noEventIconContainer}>
						<Ionicons name="calendar-outline" size={40} color={theme.text.secondary} />
					</View>
					<Text style={[styles.noEventText, { color: theme.text.base }]}>Pas de cours à venir aujourd'hui</Text>
					<Text style={[styles.noEventSubText, { color: theme.text.secondary }]}>Profite de ton temps libre !</Text>
				</View>
			);
		}

		const now = dayjs();
		const eventStart = dayjs(nextEvent.start);
		const eventEnd = dayjs(nextEvent.end);
		const isOngoing = now.isAfter(eventStart) && now.isBefore(eventEnd);

		const timeInfo = isOngoing
			? `Se termine ${eventEnd.fromNow()}`
			: `${eventStart.fromNow().replace('dans ', 'Dans ')}`;

		const handlePress = () => {
			setSelectedDate(dayjs(nextEvent.start));
			router.push('/(auth)/(tabs)/planning');
		};

		return (
			<TouchableOpacity 
				activeOpacity={0.9} 
				onPress={handlePress} 
				style={[styles.eventInfoContainer, { backgroundColor: theme.bg.alarme, shadowColor: theme.text.base }]}
			>
				<View style={styles.eventHeader}>
					<View style={[styles.statusBadge, { backgroundColor: isOngoing ? theme.colors.danger : theme.colors.primary }]}>
						<Text style={styles.statusText}>{isOngoing ? 'EN COURS' : 'PROCHAIN COURS'}</Text>
					</View>
					<Text style={[styles.timeInfoText, { color: theme.text.secondary }]}>{timeInfo}</Text>
				</View>

				<Text style={[styles.eventTitle, { color: theme.text.base }]} numberOfLines={2}>
					{nextEvent.summary}
				</Text>

				<View style={styles.eventFooter}>
					<View style={styles.footerItem}>
						<Ionicons name="time-outline" size={18} color={theme.colors.primary} />
						<Text style={[styles.footerText, { color: theme.text.base }]}>
							{formatHeure(nextEvent.start)} - {formatHeure(nextEvent.end)}
						</Text>
					</View>
					{nextEvent.location && (
						<TouchableOpacity 
							onPress={(e) => {
								e.stopPropagation();
								setSelectedDate(dayjs(nextEvent.start));
								router.push({
									pathname: '/(auth)/(tabs)/salle',
									params: { salle: nextEvent.location }
								});
							}}
							style={styles.footerItem}
						>
							<Ionicons name="location-outline" size={18} color={theme.colors.primary} />
							<Text style={[styles.footerText, { 
								color: theme.text.base, 
								backgroundColor: theme.bg.tabBarActive, 
								borderRadius: 8, 
								paddingVertical: 4,
								paddingHorizontal: 8,
								overflow: 'hidden'
							}]}>
								{nextEvent.location}
							</Text>
						</TouchableOpacity>
					)}
				</View>
			</TouchableOpacity>
		);
	};

	return (
		<SafeAreaView
			style={[
				styles.container,
				{
					backgroundColor: theme.bg.base,
					paddingTop: headerHeight,
					paddingBottom: BOTTOM_PADDING
				}
			]}
		>
			<View style={styles.content}>
				{renderEventInfo()}
				<View style={styles.sectionHeader}>
					<Text style={[styles.sectionTitle, { color: theme.text.base }]}>À venir</Text>
					<TouchableOpacity onPress={() => router.push('/(auth)/(tabs)/planning')}>
						<Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Voir tout</Text>
					</TouchableOpacity>
				</View>
				<EventList nb={"4"} estUnique={true}/>
			</View>
			<TutorialModal visible={showTutorial} onClose={handleCloseTutorial} />
		</SafeAreaView>
	);
};

export default Page;

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
		paddingTop: 10,
	},
	eventInfoContainer: {
		padding: 20,
		borderRadius: 20,
		marginBottom: 25,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 5,
	},
	eventHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 15,
	},
	statusBadge: {
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 8,
	},
	statusText: {
		color: '#FFF',
		fontSize: 10,
		fontWeight: '900',
		letterSpacing: 1,
	},
	timeInfoText: {
		fontSize: 13,
		fontWeight: '600',
	},
	eventTitle: {
		fontSize: 22,
		fontWeight: 'bold',
		marginBottom: 20,
		lineHeight: 28,
	},
	eventFooter: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 15,
	},
	footerItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	footerText: {
		fontSize: 14,
		fontWeight: '600',
	},
	noEventIconContainer: {
		alignItems: 'center',
		marginBottom: 10,
	},
	noEventText: {
		fontSize: 18,
		fontWeight: 'bold',
		textAlign: 'center',
		marginBottom: 5,
	},
	noEventSubText: {
		fontSize: 14,
		textAlign: 'center',
	},
	sectionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 15,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: 'bold',
	},
});