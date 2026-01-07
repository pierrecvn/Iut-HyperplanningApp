import CasLoginModal from '@/components/CasLoginModal';
import CustomModal from '@/components/CustomModal';
import SettingItem from "@/components/SettingItem";
import { useAuth } from '@/context/AuthContext';
import { useEdt } from "@/context/EdtContext";
import { useTheme } from '@/context/ThemeContext';
import { CalendarService, CustomCalendar } from '@/functions/calendarService';
import { NotificationService } from "@/functions/NotificationService";
import { getNotificationStatus, getPersonalIcalUrl, removeUserAllData, saveNotificationStatus } from "@/functions/supabase";
import groupInfo from '@/functions/utils/edtInfo.json';
import { UserData } from "@/interfaces/UserData";
import packageJson from '@/package.json';
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from '@react-navigation/elements';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import * as Notifications from "expo-notifications";
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Image, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { FlatList, ScrollView, } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

dayjs.locale('fr');

const { height: screenHeight } = Dimensions.get('window');


type ModalType = 'group' | 'calendar' | 'info' | 'rappel' | 'warning' | null;

const COLORS = ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722', '#795548', '#9E9E9E', '#607D8B'];

const Page = () => {
    const insets = useSafeAreaInsets();
    const headerHeight = useHeaderHeight() - insets.top;
    const { theme, isDark, toggleTheme, useSystemTheme, isSystemTheme, useRandomTheme, isRandomTheme } = useTheme();
    const BOTTOM_PADDING = useBottomTabBarHeight() - insets.bottom;
    const { defaultGroupEvents, refreshEdt } = useEdt()

    const { checkUser, connexion, deconnexion, loading, user, recupDataUtilisateur, saveGroupSupabase, saveRappelSupabase } = useAuth();
    const { width: screenWidth } = Dimensions.get('window');

    const [group, setGroup] = useState<string>('');
    const [rappel, setRappel] = useState<number>(15);
    const [data, setData] = useState<UserData | null>();
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [isInitialGroupSelection, setIsInitialGroupSelection] = useState(false);
    const [griette, setGriette] = useState(false);
    const [notificationStatus, setNotificationStatus] = useState(false);
    const [scheduledNotifications, setScheduledNotifications] = useState([]);

    // États pour le login CAS via WebView
    const [casModalVisible, setCasModalVisible] = useState(false);
    // Stocker l'URL perso séparément pour pouvoir y revenir
    const [persoGroupUrl, setPersoGroupUrl] = useState<string | null>(null);

    // État pour la recherche de groupe
    const [groupSearchText, setGroupSearchText] = useState('');

    // États pour la gestion des calendriers
    const [calendarManagerVisible, setCalendarManagerVisible] = useState(false);
    const [addCalendarModalVisible, setAddCalendarModalVisible] = useState(false);
    const [customCalendars, setCustomCalendars] = useState<CustomCalendar[]>([]);

    // États formulaire nouveau calendrier
    const [newCalName, setNewCalName] = useState('');
    const [newCalUrl, setNewCalUrl] = useState('');
    const [newCalColor, setNewCalColor] = useState(COLORS[0]);


    const loadCalendars = () => {
        const cals = CalendarService.getCalendars();
        setCustomCalendars(cals);
    };

    useEffect(() => {
        loadCalendars();
    }, []);

    const handleAddCalendar = () => {
        if (!newCalName.trim() || !newCalUrl.trim()) {
            Alert.alert("Erreur", "Le nom et l'URL sont obligatoires.");
            return;
        }
        if (!newCalUrl.startsWith('http')) {
            Alert.alert("Erreur", "L'URL doit commencer par http:// ou https://");
            return;
        }

        CalendarService.addCalendar({
            name: newCalName.trim(),
            url: newCalUrl.trim(),
            color: newCalColor,
            enabled: true
        });

        setNewCalName('');
        setNewCalUrl('');
        setNewCalColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
        setAddCalendarModalVisible(false);
        loadCalendars();
        refreshEdt();
        Alert.alert("Succès", "Calendrier ajouté !");
    };

    const handleDeleteCalendar = (id: string) => {
        Alert.alert(
            "Supprimer",
            "Voulez-vous vraiment supprimer ce calendrier ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: () => {
                        CalendarService.deleteCalendar(id);
                        loadCalendars();
                        refreshEdt();
                    }
                }
            ]
        );
    };

    const handleToggleCalendar = (id: string) => {
        CalendarService.toggleCalendar(id);
        loadCalendars();
        refreshEdt();
    };

    const handleCasSuccess = async (url: string) => {
        // Vérifier si cette URL est déjà présente dans les calendriers personnalisés
        const existingCal = customCalendars.find(c => c.url === url);
        if (existingCal) {
            Alert.alert("Info", "Ce calendrier est déjà configuré dans 'Mes Calendriers'.");
            return;
        }

        // Si un groupe est déjà défini et que ce n'est pas le planning perso actuel
        if (group && group !== '' && group !== url) {
            CalendarService.addCalendar({
                name: "Planning Univ (Auto)",
                url: url,
                color: '#E91E63',
                enabled: true
            });
            loadCalendars();
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

    // Helper pour afficher le nom du groupe proprement
    const getGroupDisplayName = (grp: string) => {
        if (!grp) return "Sélectionner un groupe";

        // Vérifier si c'est un calendrier personnalisé
        const customCal = customCalendars.find(c => c.url === grp);
        if (customCal) return `${customCal.name} (Perso)`;

        if (grp.startsWith('http')) return "Mon Planning (URL)";
        return grp;
    };

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
                    if (permission && data?.rappel && defaultGroupEvents.length > 0) {
                        await NotificationService.planifierNotificationsEvents(defaultGroupEvents, data.rappel);
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
    }, [data?.rappel, defaultGroupEvents]);

    const handleNotificationToggle = async () => {
        const newStatus = !notificationStatus;

        if (newStatus) {
            const permission = await NotificationService.initNotifications();
            if (permission && data?.rappel) {
                await NotificationService.planifierNotificationsEvents(defaultGroupEvents, data.rappel);
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

                // group
                if (data?.group == null) {
                    setActiveModal('group');
                    setIsInitialGroupSelection(true);
                } else {
                    setGroup(data.group);
                }
                // rappel
                if (data?.rappel == null) {
                    setActiveModal('rappel');
                } else {
                    setRappel(data.rappel);
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
            const existing = customCalendars.find(c => c.url === selectedGroup);
            if (!existing) {
                // On l'ajoute automatiquement pour qu'il soit disponible dans la Vue Combinée
                CalendarService.addCalendar({
                    name: `Univ (${selectedGroup})`,
                    url: selectedGroup,
                    color: '#E91E63',
                    enabled: true
                });
                loadCalendars();
            }
        }

        setGroup(selectedGroup);
        setActiveModal(null);
        setIsInitialGroupSelection(false);
        setGroupSearchText('');
        await saveGroupSupabase(selectedGroup);
    };

    const handleRappelSelection = async (selectedRappel: number) => {
        setRappel(selectedRappel);
        setActiveModal(null);
        await saveRappelSupabase(selectedRappel);

        if (notificationStatus) {
            await NotificationService.planifierNotificationsEvents(defaultGroupEvents, selectedRappel);
            const scheduled = await NotificationService.getNotificationsPlanifiees();
            setScheduledNotifications(scheduled as never);
        }
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
                    <SettingItem
                        icon="notifications-outline"
                        title="Activer les notifications"
                        description={notificationStatus ? `Vous avez ${scheduledNotifications.length} notifications planifiées` : `Activer les notifications pour recevoir des rappels ${rappel} minutes avant vos cours`}
                        value={notificationStatus}
                        onValueChange={handleNotificationToggle}
                        controlType="switch"
                    />

                    <View style={styles.separator} />

                    <SettingItem
                        icon="time-outline"
                        title="Rappels"
                        description={`Fréquence de rappel: ${rappel} minutes`}
                        onPress={() => setActiveModal('rappel')}
                        controlType="button"
                        disabled={!notificationStatus}
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

                    <SettingItem
                        icon="calendar-outline"
                        title="Gérer mes calendriers"
                        description="Ajouter des calendriers externes (Google, etc.)"
                        onPress={() => setCalendarManagerVisible(true)}
                        controlType="button"
                    />

                    <View style={styles.separator} />

                    <SettingItem
                        icon="people-outline"
                        title="Groupe par défaut"
                        description={getGroupDisplayName(group) === 'merged_view' ? 'Vue Combinée (Tous)' : getGroupDisplayName(group)}
                        onPress={() => setActiveModal('group')}
                        controlType="button"
                    />

                    <View style={styles.separator} />
                    <SettingItem
                        icon="moon-outline"
                        title="Theme sombre"
                        description="Activer le thème sombre de l'application"
                        value={isDark}
                        onValueChange={toggleTheme}
                        controlType="switch"
                    />
                    <SettingItem
                        icon="phone-portrait-outline"
                        title="Theme système"
                        description="Utiliser le thème de l'appareil"
                        value={isSystemTheme}
                        onValueChange={useSystemTheme}
                        controlType="switch"
                    />
                    <SettingItem
                        icon="shuffle-outline"
                        title="Thème aléatoire"
                        description="Changer de thème à chaque démarrage"
                        value={isRandomTheme}
                        onValueChange={useRandomTheme}
                        controlType="switch"
                    />

                    <View style={styles.separator} />

                    <SettingItem
                        icon="information-circle-outline"
                        title="À propos"
                        description={`Version ${packageJson.version}`}
                        controlType="icon"
                        rightIcon="chevron-forward"
                        onPress={() => { setActiveModal('info') }}
                    />
                </View>



                <Text style={[styles.headerTitle, { color: theme.colors.danger }]}>Zone de Danger</Text>

                <View style={[styles.settingsContainer, {
                    backgroundColor: theme.bg.alarme,
                    minWidth: screenWidth * 0.9,
                    marginBottom: 40
                }]}>

                    <SettingItem
                        icon="log-out-outline"
                        title="Se déconnecter"
                        description="Fermer votre session actuelle"
                        value={user ? true : false}
                        onValueChange={deconnexion}
                        controlType="icon"
                        rightIcon={'log-out-outline'}
                        customStyle={{ color: theme.colors.danger }}
                        // disabled={true}
                        onPress={() => { deconnexion() }}
                    />

                    {user ? (
                        <>
                            <View style={styles.separator} />
                            <SettingItem
                                icon="trash-outline"
                                title="Supprimer mon compte"
                                description="Cette action est irréversible"
                                value={user ? true : false}
                                // onValueChange={removeUserAllData}
                                onValueChange={() => setActiveModal('warning')}
                                controlType="icon"
                                rightIcon={'alert-circle-outline'}
                                customStyle={{ color: theme.colors.danger }}
                                onPress={async () => {
                                    setActiveModal('warning');
                                }}
                            />
                        </>
                    ) : null}
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

            {/* Modale Gestion Calendriers */}
            <CustomModal
                visible={calendarManagerVisible}
                onClose={() => setCalendarManagerVisible(false)}
                backgroundColor={theme.bg.base}
                primaryColor={theme.colors.primary}
                secondaryColor={theme.colors.secondary}
                headerTitle="Mes Calendriers"
                renderContent={() => {
                    // Construction de la liste incluant le calendrier universitaire si défini
                    const universityCalendar = group && !customCalendars.find(c => c.url === group) ? {
                        id: 'univ_default',
                        name: getGroupDisplayName(group),
                        url: group,
                        color: theme.colors.primary,
                        enabled: true,
                        isSystem: true
                    } : null;

                    const allCalendars = universityCalendar
                        ? [universityCalendar, ...customCalendars]
                        : customCalendars;

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
                                                onValueChange={() => handleToggleCalendar(item.id)}
                                                trackColor={{ false: theme.bg.base, true: theme.colors.primary }}
                                                thumbColor={'#fff'}
                                                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                                            />
                                        )}

                                        {!item.isSystem && (
                                            <TouchableOpacity
                                                onPress={() => handleDeleteCalendar(item.id)}
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
                                onPress={() => setAddCalendarModalVisible(true)}
                            >
                                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Ajouter un calendrier</Text>
                            </TouchableOpacity>
                        </View>
                    );
                }}
            />

            {/* Modale Ajout Calendrier */}
            <CustomModal
                visible={addCalendarModalVisible}
                onClose={() => setAddCalendarModalVisible(false)}
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
                            {COLORS.map(color => (
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
                            onPress={handleAddCalendar}
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


            <CustomModal
                visible={activeModal === 'group'}
                onClose={() => {
                    setActiveModal(null);
                    setGroupSearchText('');
                }}
                backgroundColor={theme.bg.base}
                primaryColor={theme.colors.primary}
                secondaryColor={theme.colors.secondary}
                headerTitle="⚠️ Changer le groupe par défaut ⚠️"
                renderContent={() => {
                    // On prépare la liste des groupes standards
                    const groupList = Object.keys(groupInfo);

                    // On prépare la liste des calendriers persos (URLs)
                    const customCalUrls = customCalendars.map(c => c.url);

                    // Construction de la liste finale : [Vue Combinée, ...Calendriers Customs, ...Groupes Univ]

                    let fullData = ['merged_view', ...customCalUrls, ...groupList];

                    // Si on a une URL perso stockée qui n'est pas dans les calendriers custom, on l'ajoute (legacy)
                    if (persoGroupUrl && !customCalUrls.includes(persoGroupUrl)) {
                        fullData.splice(1, 0, persoGroupUrl);
                    }

                    // Dédoublonnage
                    fullData = [...new Set(fullData)];

                    // Filtrage par recherche
                    const filteredData = fullData.filter(item => {
                        let displayName = '';
                        if (item === 'merged_view') displayName = 'Vue Combinée (Tous mes calendriers)';
                        else displayName = getGroupDisplayName(item).toLowerCase();

                        const search = groupSearchText.toLowerCase();
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
                                value={groupSearchText}
                                onChangeText={setGroupSearchText}
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
                                    const isMerged = item === 'merged_view';
                                    const display = isMerged ? 'Vue Combinée (Tous mes calendriers)' : getGroupDisplayName(item);

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
                                                handleGroupSelection(item);
                                                setGroupSearchText('');
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

            <CustomModal
                visible={activeModal === 'rappel'}
                onClose={() => setActiveModal(null)}
                backgroundColor={theme.bg.base}
                primaryColor={theme.colors.primary}
                secondaryColor={theme.colors.secondary}
                headerTitle="Changer la fréquence de rappel"
                renderContent={() => (
                    <FlatList
                        data={[5, 10, 15, 20, 30, 45, 50, 60]}
                        keyExtractor={(item: number) => item.toString()}
                        renderItem={({ item, index }) => (
                            <TouchableOpacity
                                style={[
                                    styles.groupItem,
                                    {
                                        backgroundColor: rappel === item
                                            ? theme.colors.primary
                                            : `${theme.bg.tabBarActive}${index % 2 === 0 ? '20' : '10'}`,
                                    }
                                ]}
                                onPress={() => handleRappelSelection(item)}
                            >
                                <Text style={{ color: theme.text.base }}>{item + ' min'}</Text>
                            </TouchableOpacity>
                        )}></FlatList>
                )}
            />

            <CustomModal
                visible={activeModal === 'info'}
                onClose={() => setActiveModal(null)}
                backgroundColor={theme.bg.base}
                primaryColor={theme.colors.primary}
                secondaryColor={theme.colors.secondary}
                headerTitle="Informations sur l'application"
                renderContent={() => (
                    <View style={{
                        padding: 15,
                        backgroundColor: theme.bg.alarme,
                        borderRadius: 12
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 15
                        }}>
                            <Ionicons
                                name="information-circle-outline"
                                size={24}
                                color={theme.colors.primary}
                            />
                            <Text style={[
                                styles.settingTitle,
                                {
                                    color: theme.text.base,
                                    marginLeft: 10
                                }
                            ]}>
                                Détails de l'Application
                            </Text>
                        </View>

                        <View style={{
                            backgroundColor: theme.bg.base,
                            borderRadius: 10,
                            padding: 15
                        }}>
                            <Text style={[
                                styles.settingDescription,
                                {
                                    color: theme.text.secondary,
                                    marginBottom: 8
                                }
                            ]}>
                                <Text>Nom - </Text>
                                <Text style={{ fontWeight: '900' }}>{packageJson.name}</Text>
                            </Text>
                            <View style={styles.separator} />
                            <Text style={[
                                styles.settingDescription,
                                {
                                    color: theme.text.secondary,
                                    marginBottom: 8
                                }
                            ]}>
                                <Text>Version - </Text>
                                <Text style={{ fontWeight: '900' }}>{packageJson.version}</Text>
                            </Text>
                            <View style={styles.separator} />


                            <Text style={[
                                styles.settingDescription,
                                {
                                    color: theme.text.secondary,
                                    marginBottom: 8
                                }
                            ]}>
                                <Text>Design - </Text>
                                <Text onLongPress={() => { setGriette(true) }} style={[{ fontWeight: '900', fontSize: 14, color: theme.text.secondary }]} >Cazo Joey </Text>
                                <Text style={[{ fontWeight: '900', fontSize: 14 }]}>
                                    && Cauvin Pierre
                                </Text>
                                {griette ? '\nEncore un projet où griette a servi à rien' : null}

                            </Text>

                            <View style={styles.separator} />
                            <Text style={[
                                styles.settingDescription,
                                {
                                    color: theme.text.secondary
                                }
                            ]}>
                                <Text>Développement - </Text>
                                <Text style={{ fontWeight: 'bold' }}>Cauvin Pierre </Text>
                            </Text>

                        </View>
                    </View>
                )}
            />

            <CustomModal
                visible={activeModal === 'warning'}
                onClose={() => setActiveModal(null)}
                backgroundColor={theme.bg.base}
                primaryColor="#4CAF50"
                secondaryColor={theme.colors.danger}
                headerTitle="Suppression totale des données"
                renderContent={() => (
                    <View style={{
                        padding: 15,
                        backgroundColor: theme.bg.alarme,
                        borderRadius: 12
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 15
                        }}>
                            <Ionicons
                                name="warning-outline"
                                size={24}
                                color={theme.colors.danger}
                            />
                            <Text style={[
                                styles.settingTitle,
                                {
                                    color: theme.colors.danger,
                                    marginLeft: 10
                                }
                            ]}>
                                Suppression totale des données
                            </Text>
                        </View>

                        <View style={{
                            backgroundColor: theme.bg.base,
                            borderRadius: 10,
                            padding: 15
                        }}>
                            <Text style={[
                                styles.settingDescription,
                                {
                                    color: theme.text.secondary,
                                    marginBottom: 8
                                }
                            ]}>
                                <Text>Êtes-vous sûr de vouloir supprimer toutes vos données ?</Text>
                            </Text>
                            <View style={styles.separator} />

                            <TouchableOpacity
                                style={{
                                    backgroundColor: theme.colors.danger,
                                    padding: 15,
                                    borderRadius: 10,
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                onPress={async () => {
                                    await removeUserAllData();
                                    deconnexion();
                                    setActiveModal(null);
                                }}
                            >
                                <Text style={{
                                    color: theme.text.base,
                                    fontWeight: 'bold'
                                }}>
                                    Supprimer
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                )}
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
    badgeContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    badgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
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
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    settingTexts: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 2,
    },
    settingDescription: {
        fontSize: 13,
        opacity: 0.7,
    },
    switchContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 10,
    },
    separator: {
        height: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        marginVertical: 4,
    },
    groupItem: {
        padding: 15,
    },
});

export default Page;

