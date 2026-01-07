import Icon from '@/assets/images/noEvents.svg';
import CustomModal from "@/components/CustomModal";
import {useEdt} from '@/context/EdtContext';
import {useTheme} from '@/context/ThemeContext';
import {ICalEvent} from '@/interfaces/IcalEvent';
import {FontAwesome, Ionicons} from "@expo/vector-icons";
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
dayjs.locale('fr');
import React, {useCallback, useMemo} from 'react';
import {
	ActivityIndicator,
	Dimensions,
	FlatList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native';
import {TouchableOpacity as GestureTouchableOpacity} from "react-native-gesture-handler";
import {router} from "expo-router";
import {useAuth} from "@/context/AuthContext";

interface EventListProps {
	nb?: string;
	estUnique?: boolean;
	data?: ICalEvent[];
}

type EventStatus = {
	status: string;
	timeText: string;
	color: string;
	icon: string;
};

const getTimeRemaining = (date: Date): string | null => {
	const now = dayjs();
	const target = dayjs(date);
	const diff = target.diff(now, 'minute');

	if (diff < 0) return null;

	const hours = Math.floor(diff / 60);
	const minutes = diff % 60;

	return hours > 0
		? `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`
		: `${minutes}min`;
};

const getEventDuration = (start: Date, end: Date) => {
	const duration = dayjs(end).diff(dayjs(start), 'minute');
	const hours = Math.floor(duration / 60);
	const minutes = duration % 60;

	return {
		hours,
		minutes,
		formatted: `${hours}h${minutes > 0 ? `${minutes}` : ''}`
	};
};

const isCancelled = (event: ICalEvent): boolean => {
	return event.summary.toLowerCase().startsWith('cours annulé');
};

export default function EventList({nb = "all", estUnique = false, data}: EventListProps) {
	const {theme} = useTheme();
	const {user} = useAuth();

	const {
		loading,
		error,
		getEventsForDate,
		selectedDate,
		allEvents,
		setSelectedDate
	} = useEdt();
	const [selectedEvent, setSelectedEvent] = React.useState<ICalEvent | null>(null);
	const {width: screenWidth} = Dimensions.get('window');

	const events = useMemo(() => {
		let listEvents: ICalEvent[] = [];

		if (data) {
			// Filter provided data by selectedDate
			listEvents = data.filter(event => dayjs(event.start).isSame(selectedDate, 'day'));
		} else {
			const dateToUse = estUnique ? dayjs() : selectedDate;
			listEvents = estUnique
				? getEventsForDate(dateToUse, user?.group)
				: getEventsForDate(dateToUse);
		}
		
		// console.log("allEvents : ", allEvents);

		if (nb === "all") return listEvents;

		const now = dayjs();
		const upcomingEvents = listEvents.filter(event =>
			dayjs(event.start).isAfter(now) ||
			(dayjs(event.start).isBefore(now) && dayjs(event.end).isAfter(now))
		);

		upcomingEvents.sort((a, b) => dayjs(a.start).valueOf() - dayjs(b.start).valueOf());

		const count = parseInt(nb);
		return isNaN(count) ? listEvents : upcomingEvents.slice(0, count);
	}, [getEventsForDate, estUnique ? null : selectedDate, nb, user?.group, data]);

	const eventsAvecPauseMidi = useMemo(() => {
		const eventsWithBreakInfo = [];

		for (let i = 0; i < events.length; i++) {
			eventsWithBreakInfo.push(events[i]);

			if (i < events.length - 1) {
				const currentEventEnd = dayjs(events[i].end);
				const nextEventStart = dayjs(events[i + 1].start);
				const breakDuration = nextEventStart.diff(currentEventEnd, 'minute');

				if (breakDuration > 75) {
					eventsWithBreakInfo.push({
						type: 'break',
						start: currentEventEnd.toDate(),
						end: nextEventStart.toDate(),
						duration: breakDuration
					});
				}
			}
		}

		return eventsWithBreakInfo;
	}, [events]);

	const courseDayStats = useMemo(() => {
		if (events.length === 0) return null;

		const firstEvent = dayjs(events[0].start);
		const lastEvent = dayjs(events[events.length - 1].end);
		const now = dayjs();

		const totalCourseDuration = lastEvent.diff(firstEvent, 'minute');
		const remainingTime = lastEvent.diff(now, 'minute');

		return {
			startTime: firstEvent,
			endTime: lastEvent,
			totalDuration: totalCourseDuration,
			remainingTime: remainingTime > 0 ? remainingTime : 0
		};
	}, [events]);

	React.useEffect(() => {
		const timer = setInterval(() => {
			if (selectedEvent) {
				setSelectedEvent({...selectedEvent});
			}
		}, 1000);
		return () => clearInterval(timer);
	}, [selectedEvent]);

	const getEventStatus = useCallback((event: ICalEvent): EventStatus => {
		if (isCancelled(event)) {
			return {
				status: 'close-circle',
				timeText: 'Cours annulé',
				color: `${theme.colors.danger}`,
				icon: 'close-circle'
			};
		}

		const now = dayjs();
		const start = dayjs(event.start);
		const end = dayjs(event.end);

		if (now.isBefore(start)) {
			return {
				status: 'upcoming',
				timeText: `Commence dans ${getTimeRemaining(event.start)}`,
				color: `${theme.colors.primary}`,
				icon: 'chevron-down'
			};
		}

		if (now.isAfter(end)) {
			return {
				status: 'finished',
				timeText: 'Terminé',
				color: '#757575',
				icon: 'file-tray-outline'
			};
		}

		return {
			status: 'ongoing',
			timeText: `Se termine dans ${getTimeRemaining(event.end)}`,
			color: '#4CAF50',
			icon: 'alarm-outline'
		};
	}, [theme.colors.primary, theme.colors.danger]);

	const renderBreak = (pauseMidi: any) => {
		const breakDurationHours = Math.floor(pauseMidi.duration / 60);
		const breakDurationMinutes = pauseMidi.duration % 60;

		return (
			<View
				style={[
					styles.breakCard,
					{backgroundColor: theme.bg.alarme}
				]}
			>
				<View style={styles.breakTimeColumn}>
					<FontAwesome name={"cutlery"} size={24} color={theme.text.base}/>
				</View>
				<View style={styles.breakContentColumn}>
					<Text style={[
						styles.breakDurationText,
						{color: theme.text.base}
					]}>
						Pause midi de {dayjs(pauseMidi.start).format('HH:mm')} à {dayjs(pauseMidi.end).format('HH:mm')}
						{'\n'}
						( {breakDurationHours > 0
						? `${breakDurationHours}h${breakDurationMinutes > 0 ? ` ${breakDurationMinutes}min` : ''}`
						: `${breakDurationMinutes}min`} )
					</Text>
				</View>
			</View>
		);
	};

	const renderEvent = useCallback(({item}: { item: ICalEvent | any }) => {
		if (item.type === 'break') {
			return renderBreak(item);
		}

		const eventStatus = getEventStatus(item);
		const {formatted: duration} = getEventDuration(item.start, item.end);
		const cancelled = isCancelled(item);

		return (
			<GestureTouchableOpacity
				onPress={() => setSelectedEvent(item)}
				style={[
					styles.eventCard,
					{
						shadowColor: theme.text.base,
						backgroundColor: theme.bg.base
					},
					cancelled && styles.cancelledCard,
				]}
				activeOpacity={0.8}
			>
				<View style={[styles.statusBar, {backgroundColor: eventStatus.color}]}/>

				<View style={styles.timeColumn}>
					<Text style={[
						styles.timeText,
						{color: theme.text.base},
						cancelled && styles.cancelledText
					]}>
						{dayjs(item.start).format('HH:mm')}
					</Text>
					<Text style={[
						styles.timeText,
						{color: theme.text.secondary},
						cancelled && styles.cancelledText
					]}>
						{dayjs(item.end).format('HH:mm')}
					</Text>
					<Text style={[
						styles.durationText,
						{color: theme.text.secondary},
						cancelled && styles.cancelledText
					]}>
						{duration}
					</Text>
				</View>

				<View style={styles.contentColumn}>
					<View style={styles.titleRow}>
						{cancelled && (
							<Ionicons
								name="close-circle"
								size={16}
								color={theme.colors.danger}
								style={styles.cancelIcon}
							/>
						)}
						<Text
							style={[
								styles.eventTitle,
								{color: theme.text.base},
								cancelled && styles.cancelledText
							]}
							numberOfLines={1}
						>
							{cancelled ? item.summary.substring(15) : item.summary}
						</Text>
					</View>
					<View style={styles.locationRow}>
						<Ionicons
							name="location-outline"
							size={16}
							color={cancelled ? theme.colors.danger : theme.text.secondary}
						/>
						<Text
							style={[
								styles.eventLocation,
								{color: theme.text.secondary},
								cancelled && styles.cancelledText
							]}
							numberOfLines={1}
						>
							{item.location}
						</Text>
					</View>
					<Text style={[styles.statusText, {color: eventStatus.color}]}>
						{eventStatus.timeText}
					</Text>
				</View>

				{cancelled && (
					<View style={[styles.cancelledOverlay, {borderColor: theme.colors.danger}]}/>
				)}
			</GestureTouchableOpacity>
		);
	}, [theme, getEventStatus]);

	const renderModalContent = useCallback(() => {
		if (!selectedEvent) return null;

		const eventStatus = getEventStatus(selectedEvent);
		const {hours, minutes} = getEventDuration(selectedEvent.start, selectedEvent.end);
		const cancelled = isCancelled(selectedEvent);

		const modalSections = [
			{
				icon: 'time-outline',
				content: (
					<View>
						<Text style={[
							styles.modalText,
							{color: theme.text.base},
							cancelled && styles.cancelledText
						]}>
							{dayjs(selectedEvent.start).format('HH:mm')} - {dayjs(selectedEvent.end).format('HH:mm')}
						</Text>
						<Text style={[
							styles.modalSubText,
							{color: theme.text.secondary},
							cancelled && styles.cancelledText
						]}>
							Durée : {hours}h{minutes > 0 ? ` ${minutes}min` : ''}
						</Text>
					</View>
				)
			},
			{
				icon: 'location-outline',
				content: (
					<Text style={[
						styles.modalText,
						{color: theme.text.base},
						cancelled && styles.cancelledText
					]}>
						{selectedEvent.location}
					</Text>
				)
			},
			{
				icon: 'information-circle-outline',
				content: (
					<Text style={[
						styles.modalText,
						{color: theme.text.base},
						cancelled && styles.cancelledText
					]}>
						{selectedEvent.description || 'Aucune description disponible'}
					</Text>
				)
			},
			{
				icon: 'calendar-outline',
				content: (
					<Text style={[
						styles.modalText,
						{color: theme.text.base},
						cancelled && styles.cancelledText
					]}>
						{dayjs(selectedEvent.start).locale('fr').format('dddd D MMMM YYYY')}
					</Text>
				)
			}
		];

		return (
			<View style={[styles.modalContent, {backgroundColor: theme.bg.base}]}>
				<View style={[styles.modalStatusBanner, {backgroundColor: eventStatus.color}]}>
					<Ionicons name={eventStatus.icon as any} size={24} color="white"/>
					<Text style={styles.modalStatusText}>{eventStatus.timeText}</Text>
				</View>

				<View style={styles.modalBody}>
					{modalSections.map((section, index) => (
						<View key={index} style={styles.modalSection}>
							<View style={styles.modalRow}>
								<Ionicons
									name={section.icon as any}
									size={24}
									color={cancelled ? theme.colors.danger : theme.text.base}
								/>
								{section.content}
							</View>
						</View>
					))}
				</View>
			</View>
		);
	}, [selectedEvent, theme, getEventStatus]);

	if (loading) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color={theme.colors.primary}/>
			</View>
		);
	}

	if (error) {
		return (
			<View style={styles.centered}>
				<Text style={[styles.error, {color: theme.colors.danger}]}>{error}</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{events.length === 0 ? (
				<View style={styles.iconContainer}>
					<Text style={[styles.noEventsText, {color: theme.text.base}]}>
						{nb === "all"
							? "Aucun cours pour cette journée"
							: "Aucun cours à venir pour cette journée"}
					</Text>
					<Icon width={Math.min(350, screenWidth * 0.8)} height={Math.min(350, screenWidth * 0.8)}/>


					{( !(nb == "all") && <TouchableOpacity
						style={[styles.nextDayButton, {backgroundColor: theme.bg.tapBar}]}
						onPress={() => {
							router.push('/(auth)/(tabs)/planning');
							selectedDate !== dayjs(Date.now()).add(1, 'day') && setSelectedDate(dayjs(Date.now()).add(1, 'day'));
						}}
					>
						<Ionicons
							name="arrow-forward"
							size={24}
							color={theme.colors.primary}
						/>
						<Text style={[
							styles.nextDayButtonText,
							{color: theme.colors.primary}
						]}>
							Voir le lendemain
						</Text>
					</TouchableOpacity>
						)}
				</View>
			) : (
				<>
					<FlatList
						data={eventsAvecPauseMidi}
						renderItem={renderEvent}
						keyExtractor={(item, index) =>
							item.type === 'break'
								? `break-${index}`
								: `${item.start}-${index}`
						}
						contentContainerStyle={styles.list}
						showsVerticalScrollIndicator={false}
					/>

					{courseDayStats && courseDayStats.remainingTime === 0 && (
						<TouchableOpacity
							style={[styles.nextDayButton, {backgroundColor: theme.bg.tapBar}]}
							onPress={() => {
								setSelectedDate(dayjs(Date.now()).add(1, 'day'));
							}}
						>
							<Ionicons
								name="arrow-forward"
								size={24}
								color={theme.colors.primary}
							/>
							<Text style={[
								styles.nextDayButtonText,
								{color: theme.colors.primary}
							]}>
								Voir demain
							</Text>
						</TouchableOpacity>
					)}
				</>
			)}

			<CustomModal
				visible={!!selectedEvent}
				onClose={() => setSelectedEvent(null)}
				backgroundColor={theme.bg.base}
				primaryColor={theme.colors.primary}
				secondaryColor={theme.colors.secondary}
				headerTitle={selectedEvent ? (isCancelled(selectedEvent) ? selectedEvent.summary.substring(13) : selectedEvent.summary) : ''}
				renderContent={renderModalContent}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'transparent',
		// padding: 16,
	},
	centered: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	list: {
		paddingTop: 12,
		backgroundColor: 'transparent',
	},
	iconContainer: {
		flex: 1,
		justifyContent: 'flex-start',
		alignItems: 'center',
		width: '100%',
		paddingTop: 40,
	},
	eventCard: {
		marginBottom: 16,
		marginLeft: 16,
		marginRight: 16,
		borderRadius: 12,
		overflow: 'hidden',
		elevation: 2,
		shadowOffset: {width: 0, height: 2},
		shadowOpacity: 0.1,
		shadowRadius: 4,
		flexDirection: 'row',
		position: 'relative',
	},
	cancelledCard: {
		opacity: 0.8,
	},
	statusBar: {
		width: 6,
		height: '100%',
		position: 'absolute',
		left: 0,
	},
	timeColumn: {
		paddingVertical: 12,
		paddingHorizontal: 12,
		justifyContent: 'center',
		alignItems: 'center',
		minWidth: 80,
		marginLeft: 4,
	},
	timeText: {
		fontSize: 15,
		fontWeight: '600',
	},
	durationText: {
		fontSize: 13,
		marginTop: 2,
	},
	contentColumn: {
		justifyContent: 'center',
		gap: 4,
	},
	titleRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	eventTitle: {
		fontSize: 16,
		fontWeight: 'bold',
	},
	locationRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	cancelledText: {
		textDecorationLine: 'line-through',
		textDecorationStyle: 'solid',
	},
	cancelledOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		borderWidth: 2,
		borderRadius: 12,
		opacity: 0.5,
	},
	cancelIcon: {
		marginRight: 8,
	},
	eventLocation: {
		fontSize: 14,
		flex: 1,
	},
	statusText: {
		fontSize: 13,
		fontWeight: '500',
	},
	modalContent: {
		borderRadius: 12,
		overflow: 'hidden',
	},
	modalStatusBanner: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		gap: 12,
	},
	modalStatusText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '600',
	},
	modalBody: {
		padding: 20,
	},
	modalSection: {
		marginBottom: 24,
	},
	modalRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 16,
	},
	modalText: {
		fontSize: 16,
		flex: 1,
	},
	modalSubText: {
		fontSize: 14,
		marginTop: 4,
	},
	noEventsText: {
		fontSize: 16,
		marginBottom: 20,
	},
	error: {
		fontSize: 16,
		textAlign: 'center',
	},
	breakCard: {
		marginBottom: 16,
		marginLeft: 16,
		marginRight: 16,
		borderRadius: 6,
		flexDirection: 'row',
		padding: 6,
		alignItems: 'center',
		elevation: 1,
	},
	breakTimeColumn: {
		position: 'absolute',
		justifyContent: 'center',
		alignItems: 'center',
		minWidth: 90
	},
	breakTimeText: {
		fontSize: 15,
		fontWeight: '600',
	},
	breakContentColumn: {
		flex: 1,
		marginLeft: 16,

	},
	breakDurationText: {
		fontSize: 16,
		fontWeight: '500',
		textAlign: 'center',
	},
	nextDayButton: {
		position: 'absolute',
		bottom: 20,
		right: 20,
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 10,
		paddingHorizontal: 15,
		borderRadius: 10,

	},
	nextDayButtonText: {
		marginLeft: 8,
		fontSize: 16,
		fontWeight: '500',
	}

});