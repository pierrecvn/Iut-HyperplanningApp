import CustomModal from '@/components/CustomModal';
import { SettingsSeparator } from '@/components/parametres/SettingsSection';
import SettingItem from '@/components/SettingItem';
import { useTheme } from '@/context/ThemeContext';
import { NotificationService } from '@/functions/NotificationService';
import { getNotificationStatus, saveNotificationStatus } from '@/functions/supabase';
import { ICalEvent } from '@/interfaces/IcalEvent';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

const RAPPEL_CHOICES = [5, 10, 15, 20, 30, 45, 50, 60];

type NotificationSettingsProps = {
    /** Valeur affichée, tenue par l'écran parce qu'elle est initialisée avec le groupe. */
    rappel: number;
    /**
     * Valeur réellement utilisée pour planifier, lue sur l'instantané de `user`
     * pris au montage.
     *
     * ATTENTION — elle diverge de `rappel` dès que l'utilisateur change la
     * fréquence : `setRappel` ne met pas `data` à jour. Une désactivation puis
     * réactivation des notifications replanifie donc avec l'ancienne valeur.
     * Comportement d'origine conservé tel quel ; corrigé séparément.
     */
    scheduleRappel: number | null | undefined;
    events: ICalEvent[];
    modalVisible: boolean;
    onOpenModal: () => void;
    onCloseModal: () => void;
    /** Persiste la nouvelle fréquence et ferme la modale, côté écran. */
    onSelectRappel: (rappel: number) => Promise<void>;
};

/**
 * Réglages de notification : activation, fréquence de rappel, et la modale
 * de choix de fréquence.
 */
export function NotificationSettings({
    rappel,
    scheduleRappel,
    events,
    modalVisible,
    onOpenModal,
    onCloseModal,
    onSelectRappel,
}: NotificationSettingsProps) {
    const { theme } = useTheme();

    const [notificationStatus, setNotificationStatus] = useState(false);
    const [scheduledNotifications, setScheduledNotifications] = useState([]);

    useEffect(() => {
        const initializeNotifications = async () => {
            try {

                const { status } = await Notifications.getPermissionsAsync();
                const storedStatus = getNotificationStatus();
                const isNotificationEnabled = status === 'granted' && storedStatus;

                setNotificationStatus(isNotificationEnabled);

                if (isNotificationEnabled) {
                    // Si activé, on replanifie (ça clean d'abord dans la fonction)
                    const permission = await NotificationService.initNotifications();
                    if (permission && scheduleRappel && events.length > 0) {
                        await NotificationService.planifierNotificationsEvents(events, scheduleRappel);
                    }
                } else {
                    // Si désactivé, on s'assure que tout est clean (au cas où)
                    await Notifications.cancelAllScheduledNotificationsAsync();
                }

                // On met à jour l'état pour l'affichage
                const scheduled = await Notifications.getAllScheduledNotificationsAsync();
                setScheduledNotifications(scheduled as never[]);

            } catch (error) {
                console.error('Error initializing notifications:', error);
            }
        };

        initializeNotifications();
    }, [scheduleRappel, events]);

    const handleNotificationToggle = async () => {
        const newStatus = !notificationStatus;

        if (newStatus) {
            const permission = await NotificationService.initNotifications();
            if (permission && scheduleRappel) {
                await NotificationService.planifierNotificationsEvents(events, scheduleRappel);
                const scheduled = await NotificationService.getNotificationsPlanifiees();
                setScheduledNotifications(scheduled as never);
            }
        } else {
            await Notifications.cancelAllScheduledNotificationsAsync();
            setScheduledNotifications([]);
        }

        setNotificationStatus(newStatus);
        await saveNotificationStatus(newStatus);
    };

    const handleSelectRappel = async (selectedRappel: number) => {
        await onSelectRappel(selectedRappel);

        if (notificationStatus) {
            await NotificationService.planifierNotificationsEvents(events, selectedRappel);
            const scheduled = await NotificationService.getNotificationsPlanifiees();
            setScheduledNotifications(scheduled as never);
        }
    };

    return (
        <>
            <SettingItem
                icon="notifications-outline"
                title="Activer les notifications"
                description={notificationStatus
                    ? `Vous avez ${scheduledNotifications.length} notifications planifiées`
                    : `Activer les notifications pour recevoir des rappels ${rappel} minutes avant vos cours`}
                value={notificationStatus}
                onValueChange={handleNotificationToggle}
                controlType="switch"
            />

            <SettingsSeparator />

            <SettingItem
                icon="time-outline"
                title="Rappels"
                description={`Fréquence de rappel: ${rappel} minutes`}
                onPress={onOpenModal}
                controlType="button"
                disabled={!notificationStatus}
            />

            <CustomModal
                visible={modalVisible}
                onClose={onCloseModal}
                backgroundColor={theme.bg.base}
                primaryColor={theme.colors.primary}
                secondaryColor={theme.colors.secondary}
                headerTitle="Changer la fréquence de rappel"
                renderContent={() => (
                    <FlatList
                        data={RAPPEL_CHOICES}
                        keyExtractor={(item: number) => item.toString()}
                        renderItem={({ item, index }) => (
                            <TouchableOpacity
                                style={[
                                    styles.rappelItem,
                                    {
                                        backgroundColor: rappel === item
                                            ? theme.colors.primary
                                            : `${theme.bg.tabBarActive}${index % 2 === 0 ? '20' : '10'}`,
                                    }
                                ]}
                                onPress={() => handleSelectRappel(item)}
                            >
                                <Text style={{ color: theme.text.base }}>{item + ' min'}</Text>
                            </TouchableOpacity>
                        )}></FlatList>
                )}
            />
        </>
    );
}

const styles = StyleSheet.create({
    rappelItem: {
        padding: 15,
    },
});
