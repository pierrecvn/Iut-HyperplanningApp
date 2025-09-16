import { useEdt } from '@/context/EdtContext';
import { useUpdate } from '@/context/UpdateContext';
import { useTheme } from '@/context/ThemeContext';
import { useHeaderHeight } from '@react-navigation/elements';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import relativeTime from 'dayjs/plugin/relativeTime';
import EventList from "@/components/EventList";
import { ICalEvent } from "@/interfaces/IcalEvent";
import {TouchableOpacity} from "react-native-gesture-handler";
import {router} from "expo-router";

dayjs.extend(relativeTime);
dayjs.locale('fr');

const Page = () => {
	const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
	const insets = useSafeAreaInsets();
	const headerHeight = useHeaderHeight() - insets.top;
	const BOTTOM_PADDING = useBottomTabBarHeight() - useSafeAreaInsets().bottom;
	const { theme } = useTheme();
	const { selectedDate, setSelectedDate, refreshEdt, getCoursSuivant } = useEdt();



	const nextEvent = getCoursSuivant();

	const formatHeure = (date: string | number | dayjs.Dayjs | Date | null | undefined) => {
		return dayjs(date).format('HH:mm');
	};

	const renderEventInfo = () => {
		if (!nextEvent) {
			return (
				<View style={[styles.eventInfoContainer, { backgroundColor: theme.bg.base, shadowColor: theme.text.base }]}>
					<Text style={[styles.noEventText, { color: theme.text.base }]}>Pas de cours à venir</Text>
				</View>
			);
		}

		const now = dayjs();
		const eventStart = dayjs(nextEvent.start);
		const eventEnd = dayjs(nextEvent.end);
		const isBetween = (now: dayjs.Dayjs, start: dayjs.Dayjs, end: dayjs.Dayjs) => now.isAfter(start) && now.isBefore(end);
		const isOngoing = isBetween(now, eventStart, eventEnd);

		const timeInfo = isOngoing
			? `Se termine ${eventEnd.fromNow()}`
			: `${eventStart.fromNow().replace('dans ', 'Dans ')}`;

		return (
			<TouchableOpacity activeOpacity={0.8} onLongPress={()=> {router.push('/(auth)/(tabs)/planning')}} style={[styles.eventInfoContainer, { backgroundColor: theme.bg.base, shadowColor: theme.text.base }]}>
				<Text style={[styles.eventTime, { color: theme.text.base }]}>
					{isOngoing ? 'En cours' : 'Prochain cours'} {}
				</Text>
				<View style={[styles.mainBlock, { backgroundColor: theme.colors.primary}]}>
					<Text style={[styles.eventDetails, { color: theme.text.base }]}>{nextEvent.summary}</Text>
				</View>
				<View style={styles.subBlocksContainer}>
					<View style={[styles.subBlock, { backgroundColor: theme.colors.primary }]}>
						<Text style={{ color: theme.text.base, fontWeight: "bold", fontSize: 18 }}>{formatHeure(nextEvent.start)} - {formatHeure(nextEvent.end)}</Text>
					</View>
					<View style={[styles.subBlock, { backgroundColor: theme.colors.primary }]}>
						<Text style={{ color: theme.text.base,fontWeight: "bold", fontSize: 18 }}>{timeInfo}</Text>
					</View>
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
			{renderEventInfo()}
			<EventList nb={"4"} estUnique={true}/>
		</SafeAreaView>
	);
};

export default Page;

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	eventInfoContainer: {
		margin: 16,
		padding: 16,
		borderRadius: 12,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 9,
	},
	mainBlock: {
		justifyContent: 'center',
		alignSelf: 'center',
		alignItems: 'center',
		width: '100%',
		marginBottom: 16,
		borderRadius: 10,
	},
	subBlocksContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	subBlock: {
		width: '48%',
		padding: 8,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
	},
	eventTime: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	eventDetails: {
		fontSize: 20,
		fontWeight: 'bold',
		fontFamily: 'Inter',
		marginBottom: 4,
	},
	eventTimeInfo: {
		fontSize: 18,
		marginTop: 4,
	},
	noEventText: {
		fontSize: 18,
		textAlign: 'center',
	},
});