import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { ICalEvent } from "@/interfaces/IcalEvent";
import * as BackgroundFetch from 'expo-background-fetch';
import {getNotificationStatus} from "@/functions/supabase";
import dayjs from "dayjs";

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';

// Configuration des notifications avec des options robustes
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: true,
		priority: Notifications.AndroidNotificationPriority.MAX,
	}),
});

// Définir la tâche de fond avec plus de logging
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
	try {

		const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
		console.log(`${scheduledNotifications.length} notifications planifiées back`);

		return BackgroundFetch.BackgroundFetchResult.NewData;
	} catch (error) {
		console.error('Background task error:', error);
		return BackgroundFetch.BackgroundFetchResult.Failed;
	}
});

export class NotificationService {
	static async registerBackgroundTask() {
		try {
			await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
				minimumInterval: 60 * 15, // 15 minutes
				stopOnTerminate: false,
				startOnBoot: true,
			});
			// console.log('Notifs background');
		} catch (err) {
			console.error("Notifs", err);
		}
	}

	static async initNotifications() {
		const { status: existingStatus } = await Notifications.getPermissionsAsync();
		let finalStatus = existingStatus;

		if (existingStatus !== 'granted') {
			const { status } = await Notifications.requestPermissionsAsync({
				ios: {
					allowAlert: true,
					allowBadge: true,
					allowSound: true,
					allowAnnouncements: true,
				},
				android: {
					allowAlert: true,
					allowBadge: true,
					allowSound: true,
				},
			});
			finalStatus = status;
		}

		await this.registerBackgroundTask();
		return finalStatus === 'granted';
	}

	static async planifierNotificationsEvents(events: ICalEvent[], rappelMinutes: number | undefined) {
		try {

			await Notifications.cancelAllScheduledNotificationsAsync();

			const maintenant = new Date();

			const evenementsFuturs = events.filter(event =>
				new Date(event.start.getTime() - (rappelMinutes! * 60 * 1000)) > maintenant
			);

			// Limiter le nombre de notifications
			const MAX_NOTIFICATIONS = 64;
			const notificationsAplanifier = evenementsFuturs.slice(0, MAX_NOTIFICATIONS);

			for (const event of notificationsAplanifier) {
				const notificationTime = new Date(event.start.getTime() - (rappelMinutes! * 60 * 1000));

				await Notifications.scheduleNotificationAsync({
					content: {
						title: event.summary,
						body: `A ${dayjs(event.start).format('HH:mm')} - Dans ${rappelMinutes} minutes \n${event.location || 'Pas de lieu spécifié'}`,
						data: {
							eventId: event.start.getTime().toString(),
							eventSummary: event.summary,
							eventLocation: event.location
						},
						sound: true,
						priority: Notifications.AndroidNotificationPriority.MAX,
						vibrate: [0, 250, 250, 250],
						badge: 1
					},
					trigger: {
						date: notificationTime,
						channelId: 'default',
					},
					identifier: `event-${event.start.getTime()}-${event.summary.replace(/\s+/g, '-')}`
				});
			}

			// const notifications = await this.getNotificationsPlanifiees();
			// console.log(`${notifications.length} notifications planifiées`);
		} catch (error) {
			console.error('Erreur lors de la planification des notifications:', error);
		}
	}

	static async getNotificationsPlanifiees() {
		return await Notifications.getAllScheduledNotificationsAsync();
	}
}