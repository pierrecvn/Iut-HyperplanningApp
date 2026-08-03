import Icon from '@/assets/images/noEvents.svg';
import CustomModal from "@/components/CustomModal";
import {EventCard} from '@/components/events/EventCard';
import {PauseMidiCard} from '@/components/events/PauseMidiCard';
import {useEdt} from '@/context/EdtContext';
import {useTheme} from '@/context/ThemeContext';
import {
	EventStatus,
	getEventDuration,
	getEventStatus as getStatutEvenement,
	isCancelled,
} from '@/functions/eventFormat';
import {useEventsAffichage} from '@/hooks/useEventsAffichage';
import {ICalEvent} from '@/interfaces/IcalEvent';
import {Ionicons} from "@expo/vector-icons";
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
dayjs.locale('fr');
import React, {useCallback} from 'react';
import {
	ActivityIndicator,
	Dimensions,
	FlatList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native';
import {router} from "expo-router";

interface EventListProps {
	nb?: string;
	estUnique?: boolean;
	data?: ICalEvent[];
}

export default function EventList({nb = "all", estUnique = false, data}: EventListProps) {
	const {theme} = useTheme();

	const {
		loading,
		error,
		selectedDate,
		setSelectedDate
	} = useEdt();
	const [selectedEvent, setSelectedEvent] = React.useState<ICalEvent | null>(null);
	const {width: screenWidth} = Dimensions.get('window');

	const {events, eventsAvecPauseMidi, courseDayStats} = useEventsAffichage({nb, estUnique, data});

	// Rafraîchit les comptes à rebours chaque seconde, uniquement tant qu'une
	// modale est ouverte. Le compteur ne sert qu'à provoquer un rendu.
	//
	// La version précédente recréait selectedEvent à chaque tick alors que
	// l'effet en dépendait : l'intervalle était donc détruit et recréé toutes
	// les secondes, et l'objet événement changeait d'identité pour rien.
	const [, setTick] = React.useState(0);
	const modaleOuverte = selectedEvent !== null;

	React.useEffect(() => {
		if (!modaleOuverte) return;
		const timer = setInterval(() => setTick(t => t + 1), 1000);
		return () => clearInterval(timer);
	}, [modaleOuverte]);

	const getEventStatus = useCallback(
		(event: ICalEvent): EventStatus =>
			getStatutEvenement(event, {
				primary: theme.colors.primary,
				danger: theme.colors.danger,
			}),
		[theme.colors.primary, theme.colors.danger]
	);


	const renderEvent = useCallback(({item}: { item: ICalEvent | any }) => (
		item.type === 'break'
			? <PauseMidiCard pause={item}/>
			: <EventCard event={item} onPress={setSelectedEvent}/>
	), []);


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
	cancelledText: {
		textDecorationLine: 'line-through',
		textDecorationStyle: 'solid',
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
