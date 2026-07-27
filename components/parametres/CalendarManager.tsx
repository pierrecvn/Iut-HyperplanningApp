import CustomModal from '@/components/CustomModal';
import SettingItem from '@/components/SettingItem';
import { useEdt } from '@/context/EdtContext';
import { useTheme } from '@/context/ThemeContext';
import { CustomCalendar } from '@/functions/calendarService';
import { getGroupDisplayName } from '@/functions/groupDisplay';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Dimensions, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { FlatList, ScrollView } from 'react-native-gesture-handler';

const { height: screenHeight } = Dimensions.get('window');

export const CALENDAR_COLORS = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4',
    '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107',
    '#FF9800', '#FF5722', '#795548', '#9E9E9E', '#607D8B',
];

type CalendarManagerProps = {
    /** Groupe par défaut courant, affiché en tête de liste comme « (Principal) ». */
    group: string;
    calendars: CustomCalendar[];
    onAdd: (calendar: Omit<CustomCalendar, 'id'>) => void;
    onRemove: (id: string) => void;
    onToggle: (id: string) => void;
};

/**
 * Gestion des calendriers externes : le SettingItem d'entrée et ses deux
 * modales (liste et création).
 *
 * Reçoit la liste et les mutations en props plutôt que d'appeler
 * useCalendars() lui-même : le hook s'appuie sur useState, deux appels
 * créeraient deux états distincts et le sélecteur de groupe ne verrait pas
 * les calendriers ajoutés ici.
 */
export function CalendarManager({ group, calendars, onAdd, onRemove, onToggle }: CalendarManagerProps) {
    const { theme } = useTheme();
    const { refreshEdt } = useEdt();

    const [managerVisible, setManagerVisible] = useState(false);
    const [addModalVisible, setAddModalVisible] = useState(false);

    const [newCalName, setNewCalName] = useState('');
    const [newCalUrl, setNewCalUrl] = useState('');
    const [newCalColor, setNewCalColor] = useState(CALENDAR_COLORS[0]);

    const handleAdd = () => {
        if (!newCalName.trim() || !newCalUrl.trim()) {
            Alert.alert('Erreur', "Le nom et l'URL sont obligatoires.");
            return;
        }
        if (!newCalUrl.startsWith('http')) {
            Alert.alert('Erreur', "L'URL doit commencer par http:// ou https://");
            return;
        }

        onAdd({
            name: newCalName.trim(),
            url: newCalUrl.trim(),
            color: newCalColor,
            enabled: true,
        });

        setNewCalName('');
        setNewCalUrl('');
        setNewCalColor(CALENDAR_COLORS[Math.floor(Math.random() * CALENDAR_COLORS.length)]);
        setAddModalVisible(false);
        refreshEdt();
        Alert.alert('Succès', 'Calendrier ajouté !');
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            'Supprimer',
            'Voulez-vous vraiment supprimer ce calendrier ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: () => {
                        onRemove(id);
                        refreshEdt();
                    },
                },
            ]
        );
    };

    const handleToggle = (id: string) => {
        onToggle(id);
        refreshEdt();
    };

    return (
        <>
            <SettingItem
                icon="calendar-outline"
                title="Gérer mes calendriers"
                description="Ajouter des calendriers externes (Google, etc.)"
                onPress={() => setManagerVisible(true)}
                controlType="button"
            />

            {/* Modale Gestion Calendriers */}
            <CustomModal
                visible={managerVisible}
                onClose={() => setManagerVisible(false)}
                backgroundColor={theme.bg.base}
                primaryColor={theme.colors.primary}
                secondaryColor={theme.colors.secondary}
                headerTitle="Mes Calendriers"
                renderContent={() => {
                    // Construction de la liste incluant le calendrier universitaire si défini
                    const universityCalendar = group && !calendars.find(c => c.url === group) ? {
                        id: 'univ_default',
                        name: getGroupDisplayName(group, calendars),
                        url: group,
                        color: theme.colors.primary,
                        enabled: true,
                        isSystem: true
                    } : null;

                    const allCalendars = universityCalendar
                        ? [universityCalendar, ...calendars]
                        : calendars;

                    return (
                        <View style={{ height: screenHeight * 0.5 }}>
                            <FlatList
                                data={allCalendars as any[]}
                                keyExtractor={(item) => item.id}
                                ListEmptyComponent={
                                    <Text style={{ color: theme.text.secondary, textAlign: 'center', marginTop: 20 }}>
                                        Aucun calendrier ajouté.
                                    </Text>
                                }
                                renderItem={({ item }) => (
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: theme.bg.alarme,
                                        padding: 15,
                                        borderRadius: 12,
                                        marginBottom: 10,
                                        opacity: item.isSystem ? 0.9 : 1
                                    }}>
                                        <View style={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: 6,
                                            backgroundColor: item.color,
                                            marginRight: 15
                                        }} />

                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: theme.text.base, fontWeight: 'bold' }}>
                                                {item.name} {item.isSystem && "(Principal)"}
                                            </Text>
                                            <Text style={{ color: theme.text.secondary, fontSize: 10 }} numberOfLines={1}>{item.url}</Text>
                                        </View>

                                        {!item.isSystem && (
                                            <Switch
                                                value={item.enabled}
                                                onValueChange={() => handleToggle(item.id)}
                                                trackColor={{ false: theme.bg.base, true: theme.colors.primary }}
                                                thumbColor={'#fff'}
                                                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                                            />
                                        )}

                                        {!item.isSystem && (
                                            <TouchableOpacity
                                                onPress={() => handleDelete(item.id)}
                                                style={{ marginLeft: 10, padding: 5 }}
                                            >
                                                <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}
                            />

                            <TouchableOpacity
                                style={{
                                    backgroundColor: theme.colors.primary,
                                    padding: 15,
                                    borderRadius: 10,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginTop: 15
                                }}
                                onPress={() => setAddModalVisible(true)}
                            >
                                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Ajouter un calendrier</Text>
                            </TouchableOpacity>
                        </View>
                    );
                }}
            />

            {/* Modale Ajout Calendrier */}
            <CustomModal
                visible={addModalVisible}
                onClose={() => setAddModalVisible(false)}
                backgroundColor={theme.bg.base}
                primaryColor={theme.colors.primary}
                secondaryColor={theme.colors.secondary}
                headerTitle="Nouveau Calendrier"
                renderContent={() => (
                    <View style={{
                        padding: 15,
                        backgroundColor: theme.bg.alarme,
                        borderRadius: 12
                    }}>
                        <Text style={{ color: theme.text.secondary, marginBottom: 5 }}>Nom du calendrier</Text>
                        <TextInput
                            style={{
                                backgroundColor: theme.bg.base,
                                color: theme.text.base,
                                padding: 12,
                                borderRadius: 8,
                                marginBottom: 15,
                                borderWidth: 1,
                                borderColor: theme.text.secondary + '40'
                            }}
                            placeholder="Ex: Sport, Perso..."
                            placeholderTextColor={theme.text.secondary}
                            value={newCalName}
                            onChangeText={setNewCalName}
                        />

                        <Text style={{ color: theme.text.secondary, marginBottom: 5 }}>URL (.ics)</Text>
                        <TextInput
                            style={{
                                backgroundColor: theme.bg.base,
                                color: theme.text.base,
                                padding: 12,
                                borderRadius: 8,
                                marginBottom: 15,
                                borderWidth: 1,
                                borderColor: theme.text.secondary + '40'
                            }}
                            placeholder="https://..."
                            placeholderTextColor={theme.text.secondary}
                            value={newCalUrl}
                            onChangeText={setNewCalUrl}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <Text style={{ color: theme.text.secondary, marginBottom: 10 }}>Couleur</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                            {CALENDAR_COLORS.map(color => (
                                <TouchableOpacity
                                    key={color}
                                    onPress={() => setNewCalColor(color)}
                                    style={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: 15,
                                        backgroundColor: color,
                                        marginRight: 10,
                                        borderWidth: newCalColor === color ? 3 : 0,
                                        borderColor: theme.text.base
                                    }}
                                />
                            ))}
                        </ScrollView>

                        <TouchableOpacity
                            style={{
                                backgroundColor: theme.colors.primary,
                                padding: 15,
                                borderRadius: 10,
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            onPress={handleAdd}
                        >
                            <Text style={{
                                color: '#FFF',
                                fontWeight: 'bold'
                            }}>
                                Enregistrer
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </>
    );
}
