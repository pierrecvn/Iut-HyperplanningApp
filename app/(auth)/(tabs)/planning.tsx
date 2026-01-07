import CustomModal from '@/components/CustomModal';
import EventList from '@/components/EventList';
import WeeklySchedule from '@/components/EventSemaine';
import RoundBtn from '@/components/RoundBtn';
import { useAuth } from '@/context/AuthContext';
import { useEdt } from '@/context/EdtContext';
import { useTheme } from '@/context/ThemeContext';
import groupInfo from '@/functions/utils/edtInfo.json';
import { getPersonalIcalUrl } from '@/functions/supabase';
import { CalendarService, CustomCalendar } from '@/functions/calendarService';
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from '@react-navigation/elements';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View, TextInput } from 'react-native';
import { Directions, FlatList, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from 'react-native-ui-datepicker';
import { runOnJS } from 'react-native-worklets';

type ModalType = 'group' | 'calendar' | null;
type ViewMode = 'daily' | 'weekly';

const Page = () => {
    const insets = useSafeAreaInsets();
    const headerHeight = useHeaderHeight() - insets.top;
    const { theme } = useTheme();
    const { checkUser, connexion, deconnexion, loading: authLoading, user, recupDataUtilisateur, saveGroupSupabase } = useAuth();
    const { selectedDate, setSelectedDate, refreshEdt } = useEdt();
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    const [viewMode, setViewMode] = useState<ViewMode>('daily');

    const BOTTOM_PADDING = useBottomTabBarHeight() - useSafeAreaInsets().bottom;

    const [group, setGroup] = useState<string>('');
    const [persoGroupUrl, setPersoGroupUrl] = useState<string | null>(null);
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [isInitialGroupSelection, setIsInitialGroupSelection] = useState(false);
    const modalPositionY = useRef(new Animated.Value(screenHeight)).current;
    
    // Ajouts pour la gestion avancée des groupes
    const [customCalendars, setCustomCalendars] = useState<CustomCalendar[]>([]);
    const [groupSearchText, setGroupSearchText] = useState('');

    useEffect(() => {
        setCustomCalendars(CalendarService.getCalendars());
    }, []);

    const getGroupDisplayName = (grp: string) => {
        if (!grp) return "Groupe";
        if (grp === 'merged_view') return "Vue Combinée";
        
        const customCal = customCalendars.find(c => c.url === grp);
        if (customCal) return `${customCal.name} (Perso)`;
        
        if (grp.startsWith('http')) return "Mon Planning (Perso)";
        return grp;
    };

    useEffect(() => {
        const initializeGroup = async () => {
            try {
                const storedPersoUrl = getPersonalIcalUrl();
                if (storedPersoUrl) {
                    setPersoGroupUrl(storedPersoUrl);
                }

                if (user?.group == null) {
                    setActiveModal('group');
                    setIsInitialGroupSelection(true);
                } else {
                    setGroup(user.group);
                }
            } catch (error) {
                console.error('Erreur Init groupe ', error);
            }
        };

        initializeGroup();
    }, [user]);

    const openModal = (modalType: ModalType) => {
        setActiveModal(modalType);
        if (modalType === 'group') {
            setIsInitialGroupSelection(false);
        }
        Animated.timing(modalPositionY, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
        }).start();
    };

    const closeModal = () => {
        Animated.timing(modalPositionY, {
            toValue: screenHeight,
            duration: 0,
            useNativeDriver: true,
        }).start(() => {
            setActiveModal(null);
            setIsInitialGroupSelection(false);
        });
    };

    const jourPrc = () => {
        setSelectedDate(selectedDate.subtract(viewMode === 'daily' ? 1 : 7, 'day'));
    };

    const jourSvt = () => {
        setSelectedDate(selectedDate.add(viewMode === 'daily' ? 1 : 7, 'day'));
    };

    const formatDate = (date: dayjs.Dayjs) => {
        if (viewMode === 'daily') {
            return date.format('dddd D MMMM').replace(/^\w/, (c) => c.toUpperCase());
        } else {
            const startOfWeek = date.startOf('week');
            const endOfWeek = date.endOf('week');
            return `${startOfWeek.format('D MMM')} - ${endOfWeek.format('D MMM')}`;
        }
    };

    const handleGroupSelection = async (selectedGroup: string) => {
        if (isInitialGroupSelection) {
            await saveGroupSupabase(selectedGroup);
        }
        setGroup(selectedGroup);
        closeModal();
        refreshEdt(selectedGroup);
    };

    const toggleViewMode = () => {
        setViewMode(prev => prev === 'daily' ? 'weekly' : 'daily');
    };

    const flingLeft = Gesture.Fling()
        .direction(Directions.LEFT)
        .onStart(() => {
            runOnJS(jourSvt)();
        });

    const flingRight = Gesture.Fling()
        .direction(Directions.RIGHT)
        .onStart(() => {
            runOnJS(jourPrc)();
        });

    const composedGestures = Gesture.Race(flingLeft, flingRight);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.bg.base, paddingTop: headerHeight, paddingBottom: BOTTOM_PADDING }]}>

            <View style={styles.headerWrapper}>
                <View style={styles.topBar}>
                    <TouchableOpacity
                        onPress={() => openModal('group')}
                        activeOpacity={0.6}
                        style={[styles.groupSelector, { backgroundColor: theme.colors.secondary + '15' }]}
                    >
                        <Ionicons name="people" size={18} color={theme.colors.primary} style={{ marginRight: 6 }} />
                        <Text style={[styles.groupText, { color: theme.text.base }]} numberOfLines={1}>
                            {getGroupDisplayName(group)}
                        </Text>
                        <Ionicons name="chevron-down" size={14} color={theme.text.secondary} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>

                    <View style={[styles.viewToggleContainer, { backgroundColor: theme.bg.tabBarActive }]}>
                        <TouchableOpacity
                            onPress={() => setViewMode('daily')}
                            style={[
                                styles.viewToggleBtn,
                                viewMode === 'daily' && { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary, shadowOpacity: 0.3, shadowRadius: 4, elevation: 2 }
                            ]}
                        >
                            <Text style={[styles.viewToggleText, { color: viewMode === 'daily' ? 'white' : theme.text.secondary }]}>Jour</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setViewMode('weekly')}
                            style={[
                                styles.viewToggleBtn,
                                viewMode === 'weekly' && { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary, shadowOpacity: 0.3, shadowRadius: 4, elevation: 2 }
                            ]}
                        >
                            <Text style={[styles.viewToggleText, { color: viewMode === 'weekly' ? 'white' : theme.text.secondary }]}>Semaine</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.dateNavigation}>
                    <RoundBtn
                        text=''
                        widthCircle={0.4}
                        hasIcon
                        icon="chevron-back"
                        onPress={jourPrc}
                    />

                    <TouchableOpacity
                        onPress={() => openModal('calendar')}
                        activeOpacity={0.6}
                        style={styles.dateCenter}
                    >
                        <Text style={[styles.dateText, { color: theme.text.base }]}>
                            {formatDate(selectedDate)}
                        </Text>
                        <View style={{ height: 2, width: 20, backgroundColor: theme.colors.primary, marginTop: 4, borderRadius: 2 }} />
                    </TouchableOpacity>

                    <RoundBtn
                        text=''
                        widthCircle={0.4}
                        hasIcon
                        icon="chevron-forward"
                        onPress={jourSvt}
                    />
                </View>
            </View>

            <GestureDetector gesture={composedGestures}>
                <View style={[styles.eventListContainer, { backgroundColor: theme.bg.base }]}>
                    {viewMode === 'daily' ? <EventList /> : <WeeklySchedule />}
                </View>
            </GestureDetector>

            <CustomModal
                visible={activeModal === 'calendar'}
                onClose={closeModal}
                backgroundColor={theme.bg.base}
                primaryColor={theme.colors.primary}
                secondaryColor={theme.colors.secondary}
                headerTitle="Sélection de la date"
                actionButtonLabel="Aujourd'hui"
                onActionButtonPress={() => {
                    setSelectedDate(dayjs());
                    closeModal();
                }}
                renderContent={() => (
                    <DateTimePicker
                        mode="single"
                        date={selectedDate.toDate()}
                        onChange={(params: any) => {
                            setSelectedDate(dayjs(params.date));
                            closeModal();
                        }}
                        locale="fr"
                        selectedItemColor={theme.colors.primary}
                        headerTextStyle={{ color: theme.colors.secondary }}
                        headerButtonColor={theme.colors.primary}
                        weekDaysTextStyle={{ color: theme.text.base }}
                        calendarTextStyle={{ color: theme.text.base }}
                        yearContainerStyle={{ backgroundColor: theme.bg.base }}
                        monthContainerStyle={{ backgroundColor: theme.bg.base }}
                    />
                )}></CustomModal>

            <CustomModal
                visible={activeModal === 'group'}
                onClose={() => {
                    if (!isInitialGroupSelection) closeModal();
                    setGroupSearchText('');
                }}
                backgroundColor={theme.bg.base}
                primaryColor={theme.colors.primary}
                secondaryColor={theme.colors.secondary}
                actionButtonLabel={isInitialGroupSelection ? "" : "Mon groupe"}
                onActionButtonPress={() => {
                    recupDataUtilisateur().then((data) => {
                        if (data?.group) {
                            handleGroupSelection(data.group);
                        }
                    });
                }}
                headerTitle={isInitialGroupSelection ? "⚠️ Définir le groupe par défaut ⚠️" : "Sélection du groupe"}
                renderContent={() => {
                     const groupList = Object.keys(groupInfo);
                     const customCalUrls = customCalendars.map(c => c.url);
                     
                     let fullData = ['merged_view', ...customCalUrls, ...groupList];
                     
                     if (persoGroupUrl && !customCalUrls.includes(persoGroupUrl)) {
                         fullData.splice(1, 0, persoGroupUrl);
                     }
                     
                     fullData = [...new Set(fullData)];

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
                                        style={{
                                            padding: 15,
                                            backgroundColor: (group === item) 
                                                ? theme.colors.primary 
                                                : (isMerged ? theme.colors.secondary + '20' : ((index % 2) === 0) ? theme.bg.tabBarActive + "20" : theme.bg.tabBarActive + "10"),
                                            borderWidth: isMerged ? 1 : 0,
                                            borderColor: theme.colors.primary
                                        }}
                                        onPress={() => {
                                            handleGroupSelection(item);
                                            setGroupSearchText('');
                                        }}
                                    >
                                        <Text style={{ 
                                            color: theme.text.base,
                                            fontWeight: isMerged ? 'bold' : 'normal',
                                            fontSize: isMerged ? 16 : 14
                                        }}>{display}</Text>
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                )}}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerWrapper: {
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    groupSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        maxWidth: '55%',
    },
    groupText: {
        fontSize: 14,
        fontWeight: '600',
        maxWidth: '85%',
    },
    viewToggleContainer: {
        flexDirection: 'row',
        borderRadius: 20,
        padding: 4,
    },
    viewToggleBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
    },
    viewToggleText: {
        fontSize: 12,
        fontWeight: '600',
    },
    dateNavigation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateCenter: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateText: {
        fontSize: 18,
        fontFamily: 'Inter',
        fontWeight: '800',
    },
    eventListContainer: {
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#DEDEDE',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 15,
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 8,
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
    groupItem: {
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
});

export default Page;