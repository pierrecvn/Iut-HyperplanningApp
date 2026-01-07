import CustomModal from '@/components/CustomModal';
import SettingItem from "@/components/SettingItem";
import { useAuth } from '@/context/AuthContext';
import { useEdt } from "@/context/EdtContext";
import { useTheme } from '@/context/ThemeContext';
import { NotificationService } from "@/functions/NotificationService";
import { getNotificationStatus, removeUserAllData, saveNotificationStatus } from "@/functions/supabase";
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
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FlatList, ScrollView, } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

dayjs.locale('fr');

const { height: screenHeight } = Dimensions.get('window');


type ModalType = 'group' | 'calendar' | 'info' | 'rappel' | 'warning' | null;

const Page = () => {
    const insets = useSafeAreaInsets();
    const headerHeight = useHeaderHeight() - insets.top;
    const { theme, isDark, toggleTheme, useSystemTheme, isSystemTheme, useRandomTheme, isRandomTheme } = useTheme();
    const BOTTOM_PADDING = useBottomTabBarHeight() - insets.bottom;
    const { defaultGroupEvents } = useEdt()

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

    useEffect(() => {
        const initializeNotifications = async () => {
            try {

                const { status } = await Notifications.getPermissionsAsync();
                const storedStatus = getNotificationStatus();
                const isNotificationEnabled = status === 'granted' && storedStatus;

                // console.log('Notification status:', {
                // 	systemStatus: status,
                // 	storedStatus,
                // 	finalStatus: isNotificationEnabled
                // });

                setNotificationStatus(isNotificationEnabled);

                const scheduled = await Notifications.getAllScheduledNotificationsAsync();
                setScheduledNotifications(scheduled as never[]);

                if (isNotificationEnabled && scheduled.length === 0) {
                    const permission = await NotificationService.initNotifications();
                    if (permission && data?.rappel) {
                        await NotificationService.planifierNotificationsEvents(defaultGroupEvents, data.rappel);
                    }
                }
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
        setGroup(selectedGroup);
        setActiveModal(null);
        setIsInitialGroupSelection(false);
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
                        icon="people-outline"
                        title="Groupe par défaut"
                        description={group || "Sélectionner un groupe"}
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


            <CustomModal
                visible={activeModal === 'group'}
                onClose={() => setActiveModal(null)}
                backgroundColor={theme.bg.base}
                primaryColor={theme.colors.primary}
                secondaryColor={theme.colors.secondary}
                headerTitle="⚠️ Changer le groupe par défaut ⚠️"
                renderContent={() => (
                    <FlatList
                        contentContainerStyle={{
                            paddingBottom: screenHeight * 0.1,
                        }}
                        data={Object.keys(groupInfo)}
                        keyExtractor={(item) => item}
                        renderItem={({ item, index }) => (
                            <TouchableOpacity
                                style={[
                                    styles.groupItem,
                                    {
                                        backgroundColor: group === item
                                            ? theme.colors.primary
                                            : `${theme.bg.tabBarActive}${index % 2 === 0 ? '20' : '10'}`,
                                    }
                                ]}
                                onPress={() => handleGroupSelection(item)}
                            >
                                <Text style={{ color: theme.text.base }}>{item}</Text>
                            </TouchableOpacity>
                        )}
                    />
                )}
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

