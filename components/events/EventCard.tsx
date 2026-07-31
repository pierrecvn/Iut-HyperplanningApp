import { useTheme } from '@/context/ThemeContext';
import { getEventDuration, getEventStatus, isCancelled } from '@/functions/eventFormat';
import { ICalEvent } from '@/interfaces/IcalEvent';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity as GestureTouchableOpacity } from 'react-native-gesture-handler';

/** Longueur du préfixe « cours annulé » à retirer du titre. */
const PREFIXE_ANNULE = 15;

type EventCardProps = {
    event: ICalEvent;
    onPress: (event: ICalEvent) => void;
};

/** Une ligne de la liste : horaires, titre, salle et statut d'un cours. */
export function EventCard({ event, onPress }: EventCardProps) {
    const { theme } = useTheme();

    const eventStatus = getEventStatus(event, {
        primary: theme.colors.primary,
        danger: theme.colors.danger,
    });
    const { formatted: duration } = getEventDuration(event.start, event.end);
    const cancelled = isCancelled(event);

    return (
        <GestureTouchableOpacity
            onPress={() => onPress(event)}
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
            <View style={[styles.statusBar, { backgroundColor: eventStatus.color }]} />

            <View style={styles.timeColumn}>
                <Text style={[
                    styles.timeText,
                    { color: theme.text.base },
                    cancelled && styles.cancelledText
                ]}>
                    {dayjs(event.start).format('HH:mm')}
                </Text>
                <Text style={[
                    styles.timeText,
                    { color: theme.text.secondary },
                    cancelled && styles.cancelledText
                ]}>
                    {dayjs(event.end).format('HH:mm')}
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
                        {cancelled ? event.summary.substring(PREFIXE_ANNULE) : event.summary}
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
                        {event.location}
                    </Text>
                </View>
                <Text style={[styles.statusText, { color: eventStatus.color }]}>
                    {eventStatus.timeText}
                </Text>
            </View>

            {cancelled && (
                <View style={[styles.cancelledOverlay, { borderColor: theme.colors.danger }]} />
            )}
        </GestureTouchableOpacity>
    );
}

const styles = StyleSheet.create({
    eventCard: {
        marginBottom: 16,
        marginLeft: 16,
        marginRight: 16,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
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
});
