import CustomModal from "@/components/CustomModal";
import {useEdt} from '@/context/EdtContext';
import {useTheme} from '@/context/ThemeContext';
import {ICalEvent} from "@/interfaces/IcalEvent";
import {Ionicons} from "@expo/vector-icons";
import dayjs from 'dayjs';
import React, {useCallback, useMemo} from 'react';
import {Dimensions, ScrollView, Text, TouchableOpacity, View} from 'react-native';

const HOUR_HEIGHT = 50;
const START_HOUR = 7;
const END_HOUR = 18;
const VISIBLE_HOURS = END_HOUR - START_HOUR + 1;
const TIME_LABELS = Array.from(
	{length: VISIBLE_HOURS},
	(_, i) => `${(i + START_HOUR).toString().padStart(2, '0')}:00`
);
const DAY_WIDTH = Dimensions.get('window').width / 8;

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

const isCancelled = (event: ICalEvent): boolean => {
	return event.summary.toLowerCase().startsWith('cours annulé');
};

export default function EventSemaine() {
	const {theme} = useTheme();
	const {selectedDate, allEvents} = useEdt();
	const [selectedEvent, setSelectedEvent] = React.useState<ICalEvent | null>(null);

	const weekDays = useMemo(() => {
		const startOfWeek = selectedDate.startOf('week');
		return Array.from({length: 7}, (_, i) => startOfWeek.add(i, 'day'));
	}, [selectedDate]);

	const weekEvents = useMemo(() => {
		return weekDays.map(day =>
			allEvents.filter(event => {
				const eventStart = dayjs(event.start);
				const eventHour = eventStart.hour();
				return dayjs(event.start).isSame(day, 'day') &&
					eventHour >= START_HOUR &&
					eventHour <= END_HOUR;
			})
		);
	}, [weekDays, allEvents]);

	const getEventStatus = useCallback((event: ICalEvent) => {
		if (isCancelled(event)) {
			return {
				status: 'close-circle',
				timeText: 'Cours annulé',
				color: theme.colors.danger
			};
		}

		const now = dayjs();
		const start = dayjs(event.start);
		const end = dayjs(event.end);

		if (now.isBefore(start)) {
			return {
				status: 'chevron-down',
				timeText: `Commence dans ${getTimeRemaining(event.start)}`,
				color: theme.colors.primary
			};
		}

		if (now.isAfter(end)) {
			return {
				status: 'file-tray-outline',
				timeText: 'Terminé',
				color: '#757575'
			};
		}

		return {
			status: 'alarm-outline',
			timeText: `Se termine dans ${getTimeRemaining(event.end)}`,
			color: '#4CAF50'
		};
	}, [theme.colors.primary, theme.colors.danger]);

	const EventBlock = ({event}: { event: ICalEvent }) => {
		const startTime = dayjs(event.start);
		const endTime = dayjs(event.end);
		const top = (startTime.hour() + startTime.minute() / 60 - START_HOUR) * HOUR_HEIGHT;
		const height = (endTime.diff(startTime, 'minute') / 60) * HOUR_HEIGHT;
		const cancelled = isCancelled(event);
		const eventStatus = getEventStatus(event);

		return (
			<TouchableOpacity
				onPress={() => setSelectedEvent(event)}
				style={{
					position: 'absolute',
					top,
					left: 2,
					right: 2,
					height,
					backgroundColor: cancelled ? theme.colors.danger + '40' : theme.colors.primary + '80',
					borderRadius: 4,
					padding: 4,
					borderWidth: cancelled ? 1 : 0,
					borderColor: theme.colors.danger,
					opacity: cancelled ? 0.8 : 1,
				}}
			>
				{cancelled && (
					<View style={{
						position: 'absolute',
						top: 2,
						right: 2,
					}}>
						<Ionicons name="close-circle" size={12} color={theme.colors.danger}/>
					</View>
				)}
				<Text
					numberOfLines={2}
					style={{
						color: 'white',
						fontSize: 10,
						fontWeight: 'bold',
						textDecorationLine: cancelled ? 'line-through' : 'none',
					}}
				>
					{cancelled ? event.summary.substring(15) : event.summary}
				</Text>
				<Text
					numberOfLines={1}
					style={{
						color: 'white',
						fontSize: 8,
						textDecorationLine: cancelled ? 'line-through' : 'none',
					}}
				>
					{startTime.format('HH:mm')}
				</Text>
				<Text
					numberOfLines={1}
					style={{
						color: 'white',
						fontSize: 8,
						textDecorationLine: cancelled ? 'line-through' : 'none',
					}}
				>
					{endTime.format('HH:mm')}
				</Text>
			</TouchableOpacity>
		);
	};

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
						<Text style={{
							fontSize: 16,
							color: theme.text.base,
							textDecorationLine: cancelled ? 'line-through' : 'none',
						}}>
							{dayjs(selectedEvent.start).format('HH:mm')} - {dayjs(selectedEvent.end).format('HH:mm')}
						</Text>
						<Text style={{
							fontSize: 14,
							color: theme.text.secondary,
							marginTop: 4,
							textDecorationLine: cancelled ? 'line-through' : 'none',
						}}>
							Durée : {hours}h{minutes > 0 ? ` ${minutes}min` : ''}
						</Text>
					</View>
				)
			},
			{
				icon: 'location-outline',
				content: (
					<Text style={{
						fontSize: 16,
						color: theme.text.base,
						flex: 1,
						textDecorationLine: cancelled ? 'line-through' : 'none',
					}}>
						{selectedEvent.location}
					</Text>
				)
			},
			{
				icon: 'information-circle-outline',
				content: (
					<Text style={{
						fontSize: 16,
						color: theme.text.base,
						flex: 1,
						textDecorationLine: cancelled ? 'line-through' : 'none',
					}}>
						{selectedEvent.description || 'Aucune description disponible'}
					</Text>
				)
			},
			{
				icon: 'calendar-outline',
				content: (
					<Text style={{
						fontSize: 16,
						color: theme.text.base,
						flex: 1,
						textDecorationLine: cancelled ? 'line-through' : 'none',
					}}>
						{dayjs(selectedEvent.start).format('dddd D MMMM YYYY')}
					</Text>
				)
			}
		];

		return (
			<View style={{
				borderRadius: 12,
				overflow: 'hidden',
				backgroundColor: theme.bg.base
			}}>
				<View style={{
					flexDirection: 'row',
					alignItems: 'center',
					padding: 16,
					gap: 12,
					backgroundColor: eventStatus.color
				}}>
					<Ionicons name={eventStatus.status as any} size={24} color="white"/>
					<Text style={{color: 'white', fontSize: 16, fontWeight: '600'}}>
						{eventStatus.timeText}
					</Text>
				</View>

				<View style={{padding: 20}}>
					{modalSections.map((section, index) => (
						<View key={index} style={{marginBottom: 24}}>
							<View style={{flexDirection: 'row', alignItems: 'flex-start', gap: 16}}>
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

	return (
		<View style={{
			backgroundColor: theme.bg.base,
			flex: 1,
		}}>

			<View style={{flexDirection: 'row', paddingLeft: 50}}>
				{weekDays.map((day, index) => {
					const hasCancelledEvent = weekEvents[index].some(event => isCancelled(event));
					return (
						<View
							key={index}
							style={{
								width: DAY_WIDTH,
								padding: 8,
								alignItems: 'center',
								backgroundColor: day.isSame(selectedDate, 'day')
									? theme.colors.primary + '20'
									: 'transparent'
							}}
						>
							<Text style={{color: theme.text.base, fontWeight: '500'}}>
								{day.format('ddd')}
							</Text>
							<Text style={{color: theme.text.secondary}}>
								{day.format('DD')}
							</Text>
							{hasCancelledEvent && (
								<Ionicons
									name="alert-circle-outline"
									size={16}
									color={theme.colors.danger}
									style={{marginTop: 4}}
								/>
							)}
						</View>
					);
				})}
			</View>
			<ScrollView>
				<View style={{flexDirection: 'row'}}>
					<View style={{width: 50}}>
						{TIME_LABELS.map((time, index) => (
							<View
								key={index}
								style={{
									height: HOUR_HEIGHT,
									justifyContent: 'flex-start',
									paddingTop: 0,
									paddingRight: 4
								}}
							>
								<Text
									style={{
										color: theme.text.secondary,
										fontSize: 12,
										textAlign: 'right'
									}}
								>
									{time}
								</Text>
							</View>
						))}
					</View>

					<View style={{flex: 1, flexDirection: 'row'}}>
						{weekDays.map((day, dayIndex) => (
							<View
								key={dayIndex}
								style={{
									width: DAY_WIDTH,
									height: HOUR_HEIGHT * VISIBLE_HOURS,
									borderLeftWidth: 1,
									borderLeftColor: theme.colors.secondary + '20'
								}}
							>
								{TIME_LABELS.map((_, index) => (
									<View
										key={index}
										style={{
											position: 'absolute',
											top: index * HOUR_HEIGHT,
											left: 0,
											right: 0,
											height: 1,
											backgroundColor: theme.colors.secondary + '10'
										}}
									/>
								))}

								{weekEvents[dayIndex].map((event, eventIndex) => (
									<EventBlock key={eventIndex} event={event}/>
								))}
							</View>
						))}
					</View>
				</View>
			</ScrollView>

			<CustomModal
				visible={!!selectedEvent}
				onClose={() => setSelectedEvent(null)}
				backgroundColor={theme.bg.base}
				primaryColor={theme.colors.primary}
				secondaryColor={theme.colors.secondary}
				headerTitle={selectedEvent ? (isCancelled(selectedEvent) ? selectedEvent.summary.substring(15) : selectedEvent.summary) : ''}
				renderContent={renderModalContent}
			/>
		</View>
	);
}