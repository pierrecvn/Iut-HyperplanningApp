import Icon from '@/assets/images/noEvents.svg';
import CustomModal from "@/components/CustomModal";
import { useEdt } from '@/context/EdtContext';
import { useTheme } from '@/context/ThemeContext';
import { ICalEvent } from '@/interfaces/IcalEvent';
import { Ionicons } from "@expo/vector-icons";
import dayjs from 'dayjs';
import React, { useCallback, useMemo } from 'react';
import {
	ActivityIndicator,
	Dimensions,
	FlatList,
	StyleSheet,
	Text,
	View
} from 'react-native';
import { TouchableOpacity } from "react-native-gesture-handler";

interface EventListProps {
	nb?: string;
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

export default function EventList({ nb = "all" }: EventListProps) {
	const { theme } = useTheme();
	const { loading, error, getEventsForDate, selectedDate, allEvents } = useEdt();
	const [selectedEvent, setSelectedEvent] = React.useState<ICalEvent | null>(null);
	const { width: screenWidth } = Dimensions.get('window');

	const events = useMemo(() => {
		const allEvents = getEventsForDate(selectedDate);

		if (nb === "all") return allEvents;

		// Filter upcoming events
		const now = dayjs();
		const upcomingEvents = allEvents.filter(event =>
			dayjs(event.start).isAfter(now) ||
			(dayjs(event.start).isBefore(now) && dayjs(event.end).isAfter(now))
		);

		// Sort by start time
		upcomingEvents.sort((a, b) => dayjs(a.start).valueOf() - dayjs(b.start).valueOf());


		const count = parseInt(nb);
		return isNaN(count) ? allEvents : upcomingEvents.slice(0, count);
	}, [getEventsForDate, selectedDate, nb]);


	React.useEffect(() => {
		const timer = setInterval(() => {
			if (selectedEvent) {
				setSelectedEvent({ ...selectedEvent });
				console.log(selectedEvent);
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
				color: `${theme.colors.secondary}`,
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

	const renderEvent = useCallback(({ item }: { item: ICalEvent }) => {
		const eventStatus = getEventStatus(item);
		const { formatted: duration } = getEventDuration(item.start, item.end);
		const cancelled = isCancelled(item);

		return (
			<TouchableOpacity
				onPress={() => setSelectedEvent(item)}
				style={[
					styles.eventCard,
					{ backgroundColor: theme.bg.base },
					cancelled && styles.cancelledCard
				]}
				activeOpacity={0.8}
			>
				<View style={[styles.statusBar, { backgroundColor: eventStatus.color }]} />

				<View style={styles.timeColumn}>
					<Text style={[
						styles.timeText,
						{ color: theme.text.base },
						cancelled && styles.cancelledText
					]}>
						{dayjs(item.start).format('HH:mm')}
					</Text>
					<Text style={[
						styles.timeText,
						{ color: theme.text.secondary },
						cancelled && styles.cancelledText
					]}>
						{dayjs(item.end).format('HH:mm')}
					</Text>
					<Text style={[
						styles.durationText,
						{ color: theme.text.secondary },
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
								{ color: theme.text.base },
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
								{ color: theme.text.secondary },
								cancelled && styles.cancelledText
							]}
							numberOfLines={1}
						>
							{item.location}
						</Text>
					</View>
					<Text style={[styles.statusText, { color: eventStatus.color }]}>
						{eventStatus.timeText}
					</Text>
				</View>

				{cancelled && (
					<View style={[styles.cancelledOverlay, { borderColor: theme.colors.danger }]} />
				)}
			</TouchableOpacity>
		);
	}, [theme, getEventStatus]);

	const renderModalContent = useCallback(() => {
		if (!selectedEvent) return null;

		const eventStatus = getEventStatus(selectedEvent);
		const { hours, minutes } = getEventDuration(selectedEvent.start, selectedEvent.end);
		const cancelled = isCancelled(selectedEvent);

		const modalSections = [
			{
				icon: 'time-outline',
				content: (
					<View>
						<Text style={[
							styles.modalText,
							{ color: theme.text.base },
							cancelled && styles.cancelledText
						]}>
							{dayjs(selectedEvent.start).format('HH:mm')} - {dayjs(selectedEvent.end).format('HH:mm')}
						</Text>
						<Text style={[
							styles.modalSubText,
							{ color: theme.text.secondary },
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
						{ color: theme.text.base },
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
						{ color: theme.text.base },
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
						{ color: theme.text.base },
						cancelled && styles.cancelledText
					]}>
						{dayjs(selectedEvent.start).format('dddd D MMMM YYYY')}
					</Text>
				)
			}
		];

		return (
			<View style={[styles.modalContent, { backgroundColor: theme.bg.base }]}>
				<View style={[styles.modalStatusBanner, { backgroundColor: eventStatus.color }]}>
					<Ionicons name={eventStatus.icon as any} size={24} color="white" />
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
				<ActivityIndicator size="large" color={theme.colors.primary} />
			</View>
		);
	}

	if (error) {
		return (
			<View style={styles.centered}>
				<Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{events.length === 0 ? (
				<View style={styles.iconContainer}>
					<Text style={[styles.noEventsText, { color: theme.text.base }]}>
						{nb === "all"
							? "Aucun cours pour cette journée"
							: "Aucun cours à venir pour cette journée"}
					</Text>
					<Icon width={Math.min(350, screenWidth * 0.8)} height={Math.min(350, screenWidth * 0.8)} />
				</View>
			) : (
				<FlatList
					data={events}
					renderItem={renderEvent}
					keyExtractor={(item, index) => `${item.start}-${index}`}
					contentContainerStyle={styles.list}
					showsVerticalScrollIndicator={false}
				/>
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
		padding: 20,
	},
	centered: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	list: {
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
		marginBottom: 12,
		borderRadius: 12,
		overflow: 'hidden',
		elevation: 3,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		flexDirection: 'row',
		position: 'relative',
	},
	cancelledCard: {
		opacity: 0.8,
	},
	statusBar: {
		width: 4,
		height: '100%',
		position: 'absolute',
		left: 0,
	},
	timeColumn: {
		paddingVertical: 12,
		paddingHorizontal: 12,
		justifyContent: 'center',
		alignItems: 'center',
		borderRightWidth: 1,
		borderRightColor: 'rgba(0,0,0,0.1)',
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
});