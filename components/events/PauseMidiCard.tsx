import { useTheme } from '@/context/ThemeContext';
import { PauseMidi } from '@/hooks/useEventsAffichage';
import { FontAwesome } from '@expo/vector-icons';
import dayjs from 'dayjs';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type PauseMidiCardProps = {
    pause: PauseMidi;
};

/** L'encart inséré entre deux cours séparés de plus de 75 minutes. */
export function PauseMidiCard({ pause }: PauseMidiCardProps) {
    const { theme } = useTheme();

    const heures = Math.floor(pause.duration / 60);
    const minutes = pause.duration % 60;

    return (
        <View
            style={[
                styles.breakCard,
                { backgroundColor: theme.bg.alarme }
            ]}
        >
            <View style={styles.breakTimeColumn}>
                <FontAwesome name={"cutlery"} size={24} color={theme.text.base} />
            </View>
            <View style={styles.breakContentColumn}>
                <Text style={[
                    styles.breakDurationText,
                    { color: theme.text.base }
                ]}>
                    Pause midi de {dayjs(pause.start).format('HH:mm')} à {dayjs(pause.end).format('HH:mm')}
                    {'\n'}
                    ( {heures > 0
                        ? `${heures}h${minutes > 0 ? ` ${minutes}min` : ''}`
                        : `${minutes}min`} )
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
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
    breakContentColumn: {
        flex: 1,
        marginLeft: 16,
    },
    breakDurationText: {
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
    },
});
