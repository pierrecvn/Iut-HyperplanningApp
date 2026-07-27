import CasLoginModal from '@/components/CasLoginModal';
import { AboutSetting } from '@/components/parametres/AboutSetting';
import { AccountSection } from '@/components/parametres/AccountSection';
import { AppearanceSettings } from '@/components/parametres/AppearanceSettings';
import { CalendarManager } from '@/components/parametres/CalendarManager';
import { GroupSelector } from '@/components/parametres/GroupSelector';
import { NotificationSettings } from '@/components/parametres/NotificationSettings';
import SettingItem from "@/components/SettingItem";
import { useAuth } from '@/context/AuthContext';
import { useEdt } from "@/context/EdtContext";
import { useTheme } from '@/context/ThemeContext';
import { getPersonalIcalUrl } from "@/functions/supabase";
import { useCalendars } from '@/hooks/useCalendars';
import { UserData } from "@/interfaces/UserData";
import packageJson from '@/package.json';
import { useBottomTabBarHeight } from "expo-router/js-tabs";
import { useHeaderHeight } from "expo-router/react-navigation";
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

dayjs.locale('fr');

type ModalType = 'group' | 'calendar' | 'info' | 'rappel' | 'warning' | null;

const Page = () => {
    const insets = useSafeAreaInsets();
    const headerHeight = useHeaderHeight() - insets.top;
    const { theme } = useTheme();
    const BOTTOM_PADDING = useBottomTabBarHeight() - insets.bottom;
    const { defaultGroupEvents, refreshEdt } = useEdt()

    const { user, saveGroupSupabase, saveRappelSupabase } = useAuth();
    const { width: screenWidth } = Dimensions.get('window');

    const [group, setGroup] = useState<string>('');
    // null = jamais configuré. Source unique : sert à l'affichage ET à la
    // planification, pour que les deux ne puissent plus diverger.
    const [rappel, setRappel] = useState<number | null>(null);
    const [data, setData] = useState<UserData | null>();
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [isInitialGroupSelection, setIsInitialGroupSelection] = useState(false);

    // États pour le login CAS via WebView
    const [casModalVisible, setCasModalVisible] = useState(false);
    // Stocker l'URL perso séparément pour pouvoir y revenir
    const [persoGroupUrl, setPersoGroupUrl] = useState<string | null>(null);

    // Liste des calendriers personnalisés : un seul état, partagé par le
    // gestionnaire de calendriers et le sélecteur de groupe.
    const { calendars, add: addCalendar, remove: removeCalendar, toggle: toggleCalendar } = useCalendars();

    const handleCasSuccess = async (url: string) => {
        // Vérifier si cette URL est déjà présente dans les calendriers personnalisés
        const existingCal = calendars.find(c => c.url === url);
        if (existingCal) {
            Alert.alert("Info", "Ce calendrier est déjà configuré dans 'Mes Calendriers'.");
            return;
        }

        // Si un groupe est déjà défini et que ce n'est pas le planning perso actuel
        if (group && group !== '' && group !== url) {
            addCalendar({
                name: "Planning Univ (Auto)",
                url: url,
                color: '#E91E63',
                enabled: true
            });
            refreshEdt();
            setPersoGroupUrl(url);
            Alert.alert("Succès", "Votre planning a été ajouté à 'Mes Calendriers' sans remplacer votre groupe par défaut !");
        } else {
            // Comportement standard : devient le groupe principal
            await handleGroupSelection(url);
            setPersoGroupUrl(url);
            Alert.alert("Succès", "Votre emploi du temps personnel a été récupéré et configuré !");
        }
    };

    useEffect(() => {
        const initializeGroup = async () => {
            try {
                const data = user;
                setData(data);

                // Initialiser l'URL perso stockée
                const storedPersoUrl = getPersonalIcalUrl();
                if (storedPersoUrl) {
                    setPersoGroupUrl(storedPersoUrl);
                }

                if (data?.group != null) setGroup(data.group);
                if (data?.rappel != null) setRappel(data.rappel);

                // Une seule modale à la fois : le groupe d'abord, le rappel
                // ensuite. Auparavant les deux affectations se suivaient et la
                // seconde écrasait la première, si bien qu'un nouvel
                // utilisateur ne voyait jamais la sélection de groupe.
                if (data?.group == null) {
                    setIsInitialGroupSelection(true);
                    setActiveModal('group');
                } else if (data?.rappel == null) {
                    setActiveModal('rappel');
                }

            } catch (error) {
                console.error('Erreur Init groupe ', error);
            }
        };

        initializeGroup();
    }, []);

    const handleGroupSelection = async (selectedGroup: string) => {
        // Si c'est un groupe standard (pas une URL custom ni la vue combinée)
        if (selectedGroup !== 'merged_view' && !selectedGroup.startsWith('http')) {
            const existing = calendars.find(c => c.url === selectedGroup);
            if (!existing) {
                // On l'ajoute automatiquement pour qu'il soit disponible dans la Vue Combinée
                addCalendar({
                    name: `Univ (${selectedGroup})`,
                    url: selectedGroup,
                    color: '#E91E63',
                    enabled: true
                });
            }
        }

        setGroup(selectedGroup);
        setIsInitialGroupSelection(false);
        // La remise à zéro de la recherche appartient désormais à GroupSelector.

        // Premier lancement : enchaîner sur le choix du rappel, qui n'avait
        // jamais pu s'afficher tant que le groupe occupait activeModal.
        if (isInitialGroupSelection && rappel == null) {
            setActiveModal('rappel');
        } else {
            setActiveModal(null);
        }

        await saveGroupSupabase(selectedGroup);
    };

    // La replanification qui suivait cet enregistrement appartient désormais à
    // NotificationSettings, qui possède l'état d'activation.
    const handleRappelSelection = async (selectedRappel: number) => {
        setRappel(selectedRappel);
        setActiveModal(null);
        await saveRappelSupabase(selectedRappel);
    }


    return (
        <SafeAreaView style={[styles.container, {
            backgroundColor: theme.bg.base,
            paddingTop: headerHeight,
            paddingBottom: BOTTOM_PADDING
        }]}

        >
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {user && (
                    <View style={[styles.profileCardContainer, { backgroundColor: theme.bg.alarme, shadowColor: theme.text.base }]}>
                        <View style={styles.profileHeader}>
                            <Image
                                source={{ uri: user.avatar_url }}
                                style={styles.avatar}
                            />
                            <View style={styles.profileInfo}>
                                <Text style={[styles.profileName, { color: theme.text.base }]}>
                                    {data?.full_name}
                                </Text>
                                <Text style={[styles.profileEmail, { color: theme.text.secondary }]}>
                                    {data?.email}
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.separator, { marginVertical: 12 }]} />

                        <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: theme.colors.primary }]}>{data?.api_requests_count || 0}</Text>
                                <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Requêtes</Text>
                            </View>
                            <View style={[styles.verticalSeparator, { backgroundColor: theme.text.secondary + '20' }]} />
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: theme.text.base }]}>{dayjs(data?.created_at).format('DD/MM/YY')}</Text>
                                <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Membre depuis</Text>
                            </View>
                        </View>
                    </View>
                )}

                <Text style={[styles.headerTitle, { color: theme.text.base }]}>Notifications</Text>

                <View style={[styles.settingsContainer, {
                    backgroundColor: theme.bg.alarme,
                    minWidth: screenWidth * 0.9
                }]}>
                    <NotificationSettings
                        rappel={rappel}
                        events={defaultGroupEvents}
                        modalVisible={activeModal === 'rappel'}
                        onOpenModal={() => setActiveModal('rappel')}
                        onCloseModal={() => setActiveModal(null)}
                        onSelectRappel={handleRappelSelection}
                    />
                </View>

                <Text style={[styles.headerTitle, { color: theme.text.base }]}>Général</Text>

                <View style={[styles.settingsContainer, {
                    backgroundColor: theme.bg.alarme,
                    minWidth: screenWidth * 0.9
                }]}>
                    <SettingItem
                        icon="school-outline"
                        title="Connexion Université (Auto)"
                        description="Récupérer automatiquement mon planning perso"
                        onPress={() => setCasModalVisible(true)}
                        controlType="button"
                    />

                    <View style={styles.separator} />

                    <CalendarManager
                        group={group}
                        calendars={calendars}
                        onAdd={addCalendar}
                        onRemove={removeCalendar}
                        onToggle={toggleCalendar}
                    />

                    <View style={styles.separator} />

                    <GroupSelector
                        group={group}
                        calendars={calendars}
                        persoGroupUrl={persoGroupUrl}
                        visible={activeModal === 'group'}
                        onOpen={() => setActiveModal('group')}
                        onClose={() => setActiveModal(null)}
                        onSelect={handleGroupSelection}
                    />

                    <View style={styles.separator} />

                    <AppearanceSettings />

                    <View style={styles.separator} />

                    <AboutSetting
                        modalVisible={activeModal === 'info'}
                        onOpenModal={() => setActiveModal('info')}
                        onCloseModal={() => setActiveModal(null)}
                    />
                </View>



                <Text style={[styles.headerTitle, { color: theme.colors.danger }]}>Zone de Danger</Text>

                <View style={[styles.settingsContainer, {
                    backgroundColor: theme.bg.alarme,
                    minWidth: screenWidth * 0.9,
                    marginBottom: 40
                }]}>

                    <AccountSection
                        modalVisible={activeModal === 'warning'}
                        onOpenModal={() => setActiveModal('warning')}
                        onCloseModal={() => setActiveModal(null)}
                    />
                </View>

                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                    <Text style={{ color: theme.text.secondary, fontSize: 12 }}>Iut-HyperplanningApp v{packageJson.version}</Text>
                </View>
            </ScrollView>

            <CasLoginModal
                visible={casModalVisible}
                onClose={() => setCasModalVisible(false)}
                onSuccess={handleCasSuccess}
                theme={theme}
            />




        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20
    },
    content: {
        flex: 1,
        width: '100%',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        paddingBottom: 10,
        paddingLeft: 4,
        opacity: 0.8,
    },
    settingsContainer: {
        padding: 10,
        borderRadius: 16,
        marginBottom: 20,
    },
    profileCardContainer: {
        borderRadius: 20,
        marginBottom: 24,
        overflow: 'hidden',
        padding: 24,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        height: 64,
        width: 64,
        borderRadius: 32,
        marginRight: 16,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    profileInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    profileName: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    profileEmail: {
        fontSize: 14,
        marginBottom: 8,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    verticalSeparator: {
        width: 1,
        height: '60%',
    },
    separator: {
        height: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        marginVertical: 4,
    },
});

export default Page;

