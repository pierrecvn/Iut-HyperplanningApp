import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { ICalEvent } from "@/interfaces/IcalEvent";
import * as BackgroundFetch from 'expo-background-fetch';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';

// Configuration des notifications avec plus d'options
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: true,
		priority: Notifications.AndroidNotificationPriority.HIGH,
	}),
});

// Définir la tâche de fond
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
	try {
		return BackgroundFetch.BackgroundFetchResult.NewData;
	} catch (error) {
		return BackgroundFetch.BackgroundFetchResult.Failed;
	}
});

export class NotificationService {
	static async registerBackgroundTask() {
		try {
			await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
				minimumInterval: 60 * 15, // 15 minutes
				stopOnTerminate: false,   // Android uniquement: continuer après fermeture
				startOnBoot: true,        // Android uniquement: démarrer au boot
			});
		} catch (err) {
			console.log("Task Register failed:", err);
		}
	}

	static async initNotifications() {
		// Demander toutes les permissions nécessaires
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

		// Enregistrer la tâche de fond
		await this.registerBackgroundTask();

		return finalStatus === 'granted';
	}

	static async planifierNotificationsEvents(events: ICalEvent[], rappelMinutes: number) {
		try {
			// Annuler les notifications existantes
			await Notifications.cancelAllScheduledNotificationsAsync();

			// Filtrer les événements futurs
			const maintenant = new Date();
			const evenementsFuturs = events.filter(event =>
				new Date(event.start.getTime() - (rappelMinutes * 60 * 1000)) > maintenant
			);

			// Planifier les nouvelles notifications
			for (const event of evenementsFuturs) {
				const notificationTime = new Date(event.start.getTime() - (rappelMinutes * 60 * 1000));

				await Notifications.scheduleNotificationAsync({
					content: {
						title: event.summary,
						body: `Dans ${rappelMinutes} minutes - ${event.location || 'Pas de lieu spécifié'}`,
						data: { eventId: event.start.getTime().toString() },
						sound: true,
						priority: Notifications.AndroidNotificationPriority.HIGH,
						vibrate: [0, 250, 250, 250],
						},
					trigger: {
						date: notificationTime,
						channelId: 'default',
					},
					identifier: `event-${event.start.getTime()}`,
				});
			}

			const notifications = await this.getNotificationsPlanifiees();
			console.log(`${notifications.length} notifications planifiées`);
		} catch (error) {
			console.error('Erreur lors de la planification des notifications:', error);
		}
	}

	static async getNotificationsPlanifiees() {
		return await Notifications.getAllScheduledNotificationsAsync();
	}
}