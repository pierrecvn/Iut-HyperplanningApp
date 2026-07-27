import CustomModal from '@/components/CustomModal';
import SettingItem from '@/components/SettingItem';
import { useTheme } from '@/context/ThemeContext';
import { CustomCalendar } from '@/functions/calendarService';
import { getGroupDisplayName } from '@/functions/groupDisplay';
import groupInfo from '@/functions/utils/edtInfo.json';
import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

const { height: screenHeight } = Dimensions.get('window');

const MERGED_VIEW = 'merged_view';
const MERGED_VIEW_LABEL = 'Vue Combinée (Tous mes calendriers)';

type GroupSelectorProps = {
    group: string;
    calendars: CustomCalendar[];
    /** URL perso héritée, insérée en tête si absente des calendriers. */
    persoGroupUrl: string | null;
    visible: boolean;
    onOpen: () => void;
    onClose: () => void;
    onSelect: (group: string) => void;
};

/**
 * Choix du groupe par défaut : le SettingItem d'entrée et sa modale de
 * recherche.
 *
 * La visibilité de la modale reste pilotée par le parent : au premier
 * lancement, l'écran l'ouvre lui-même quand l'utilisateur n'a pas encore
 * de groupe. Ce composant possède en revanche son texte de recherche,
 * qui n'intéresse personne d'autre.
 */
export function GroupSelector({
    group,
    calendars,
    persoGroupUrl,
    visible,
    onOpen,
    onClose,
    onSelect,
}: GroupSelectorProps) {
    const { theme } = useTheme();
    const [searchText, setSearchText] = useState('');

    const close = () => {
        onClose();
        setSearchText('');
    };

    const displayLabel = getGroupDisplayName(group, calendars);

    return (
        <>
            <SettingItem
                icon="people-outline"
                title="Groupe par défaut"
                description={displayLabel === MERGED_VIEW ? 'Vue Combinée (Tous)' : displayLabel}
                onPress={onOpen}
                controlType="button"
            />

            <CustomModal
                visible={visible}
                onClose={close}
                backgroundColor={theme.bg.base}
                primaryColor={theme.colors.primary}
                secondaryColor={theme.colors.secondary}
                headerTitle="⚠️ Changer le groupe par défaut ⚠️"
                renderContent={() => {
                    // On prépare la liste des groupes standards
                    const groupList = Object.keys(groupInfo);

                    // On prépare la liste des calendriers persos (URLs)
                    const customCalUrls = calendars.map(c => c.url);

                    // Construction de la liste finale : [Vue Combinée, ...Calendriers Customs, ...Groupes Univ]
                    let fullData = [MERGED_VIEW, ...customCalUrls, ...groupList];

                    // Si on a une URL perso stockée qui n'est pas dans les calendriers custom, on l'ajoute (legacy)
                    if (persoGroupUrl && !customCalUrls.includes(persoGroupUrl)) {
                        fullData.splice(1, 0, persoGroupUrl);
                    }

                    // Dédoublonnage
                    fullData = [...new Set(fullData)];

                    // Filtrage par recherche
                    const filteredData = fullData.filter(item => {
                        let displayName = '';
                        if (item === MERGED_VIEW) displayName = MERGED_VIEW_LABEL;
                        else displayName = getGroupDisplayName(item, calendars).toLowerCase();

                        const search = searchText.toLowerCase();
                        return displayName.includes(search);
                    });

                    return (
                        <View style={{ height: screenHeight * 0.7 }}>
                            <TextInput
                                style={{
                                    backgroundColor: theme.bg.alarme,
                                    color: theme.text.base,
                                    padding: 12,
                                    borderRadius: 12,
                                    marginBottom: 10,
                                    fontSize: 16
                                }}
                                placeholder="Rechercher un groupe..."
                                placeholderTextColor={theme.text.secondary}
                                value={searchText}
                                onChangeText={setSearchText}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            <FlatList
                                contentContainerStyle={{
                                    paddingBottom: screenHeight * 0.1,
                                }}
                                data={filteredData}
                                keyExtractor={(item) => item}
                                initialNumToRender={20}
                                maxToRenderPerBatch={20}
                                windowSize={10}
                                renderItem={({ item, index }) => {
                                    const isMerged = item === MERGED_VIEW;
                                    const display = isMerged ? MERGED_VIEW_LABEL : getGroupDisplayName(item, calendars);

                                    return (
                                        <TouchableOpacity
                                            style={[
                                                styles.groupItem,
                                                {
                                                    backgroundColor: group === item
                                                        ? theme.colors.primary
                                                        : (isMerged ? theme.colors.secondary + '20' : `${theme.bg.tabBarActive}${index % 2 === 0 ? '20' : '10'}`),
                                                    borderWidth: isMerged ? 1 : 0,
                                                    borderColor: theme.colors.primary
                                                }
                                            ]}
                                            onPress={() => {
                                                onSelect(item);
                                                setSearchText('');
                                            }}
                                        >
                                            <Text style={{
                                                color: theme.text.base,
                                                fontWeight: isMerged ? 'bold' : 'normal',
                                                fontSize: isMerged ? 16 : 14
                                            }}>
                                                {display}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        </View>
                    );
                }}
            />
        </>
    );
}

const styles = StyleSheet.create({
    groupItem: {
        padding: 15,
    },
});
