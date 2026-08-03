import { ChangementEdt } from "@/functions/edtDiff";
import { ICalEvent } from "@/interfaces/IcalEvent";
import dayjs from "dayjs";
import 'dayjs/locale/fr';
import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { createMMKV } from 'react-native-mmkv';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';

/**
 * Intervalle de la tâche de fond, EN MINUTES.
 *
 * expo-background-task attend des minutes, pas des secondes : côté natif,
 * BackgroundTaskScheduler fait Duration.ofMinutes(valeur). L'ancienne valeur
 * `60 * 15` ne valait donc pas 15 minutes mais 900 minutes, soit 15 heures.
 *
 * Android impose de toute façon un plancher de 15 minutes, et l'intervalle
 * reste un délai minimum sans garantie : WorkManager le soumet au Doze, aux
 * buckets App Standby et aux surcouches constructeur.
 */
const INTERVALLE_TACHE_FOND_MINUTES = 15;

/**
 * Version du paramétrage de la tâche de fond.
 *
 * registerTaskAsync sort silencieusement si la tâche est déjà enregistrée, en
 * ignorant les options. Sans ce marqueur, les installations existantes
 * garderaient l'ancien intervalle de 15 heures pour toujours. À incrémenter à
 * chaque changement d'options.
 */
const VERSION_CONFIG_TACHE = 2;
const CLE_VERSION_CONFIG = 'background_task_config_version';

const storage = createMMKV();

/** Une ligne lisible par changement, destinée au corps de la notification. */
function decrireChangement(c: ChangementEdt): string {
    const quand = dayjs(c.event.start).format('ddd D MMM [à] HH:mm');
    const titre = c.event.summary;

    switch (c.type) {
        case 'annule':
            return `Annulé — ${titre} (${quand})`;
        case 'supprime':
            return `Retiré — ${titre} (${quand})`;
        case 'ajoute':
            return `Ajouté — ${titre} (${quand})`;
        case 'deplace':
            return `Déplacé — ${titre} : ${dayjs(c.avantStart).format('ddd D MMM HH:mm')} → ${quand}`;
        case 'salle':
            return `Salle — ${titre} (${quand}) : ${c.avantLocation} → ${c.event.location}`;
    }
}

// Configuration des notifications avec des options robustes
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
    }),
});

// Définir la tâche de fond avec plus de logging
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
    try {
        const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
        console.log(`${scheduledNotifications.length} notifications planifiées back`);

        return BackgroundTask.BackgroundTaskResult.Success;
    } catch (error) {
        console.error('Background task error:', error);
        return BackgroundTask.BackgroundTaskResult.Failed;
    }
});

export class NotificationService {
    static async registerBackgroundTask() {
        try {
            const versionEnregistree = storage.getNumber(CLE_VERSION_CONFIG) ?? 0;
            const dejaEnregistree = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);

            // Le désenregistrement n'a lieu qu'une fois, à la migration : le
            // refaire à chaque ouverture de l'app remettrait le compte à rebours
            // à zéro et la tâche ne s'exécuterait jamais.
            if (dejaEnregistree && versionEnregistree < VERSION_CONFIG_TACHE) {
                await BackgroundTask.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);
            }

            await BackgroundTask.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
                minimumInterval: INTERVALLE_TACHE_FOND_MINUTES,
            });

            storage.set(CLE_VERSION_CONFIG, VERSION_CONFIG_TACHE);
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

                // S'assurer que la notification est au moins 5 secondes dans le futur
                if (notificationTime.getTime() <= Date.now() + 5000) {
                    continue;
                }

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
                        type: Notifications.SchedulableTriggerInputTypes.DATE,
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

    /**
     * Notifie immédiatement les changements détectés dans l'emploi du temps.
     *
     * Volontairement envoyée hors du système de planification : celui-ci fait
     * un cancelAllScheduledNotificationsAsync à chaque replanification des
     * rappels, ce qui effacerait une notification de changement planifiée.
     * Ici le déclencheur est `null`, donc la notification part tout de suite
     * et n'entre jamais dans la file des rappels.
     */
    static async notifierChangements(changements: ChangementEdt[]) {
        if (changements.length === 0) return;

        try {
            const titre = changements.length === 1
                ? 'Ton emploi du temps a changé'
                : `${changements.length} changements dans ton emploi du temps`;

            // Au-delà de trois, le détail devient illisible dans une
            // notification : on résume et l'utilisateur ouvre l'app.
            const corps = changements.length <= 3
                ? changements.map(decrireChangement).join('\n')
                : changements.slice(0, 3).map(decrireChangement).join('\n')
                    + `\net ${changements.length - 3} autre${changements.length - 3 > 1 ? 's' : ''}`;

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: titre,
                    body: corps,
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                    data: { genre: 'changement_edt' },
                },
                trigger: null,
            });
        } catch (error) {
            console.error('Erreur lors de la notification de changement :', error);
        }
    }
}