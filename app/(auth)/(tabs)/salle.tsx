import CustomModal from '@/components/CustomModal';
import EventList from '@/components/EventList';
import WeeklySchedule from '@/components/EventSemaine';
import RoundBtn from '@/components/RoundBtn';
import { useEdt } from '@/context/EdtContext';
import { useTheme } from '@/context/ThemeContext';
import { HyperplanningApi } from '@/functions/hyperplanning';
import salleInfo from '@/functions/utils/salleInfo.json';
import { ICalEvent } from '@/interfaces/IcalEvent';
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from '@react-navigation/elements';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Directions, FlatList, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from 'react-native-ui-datepicker';
import { runOnJS } from 'react-native-worklets';

import { useLocalSearchParams } from 'expo-router';

type ModalType = 'salle' | 'calendar' | null;
type ViewMode = 'daily' | 'weekly';

const Page = () => {
    const insets = useSafeAreaInsets();
    const headerHeight = useHeaderHeight() - insets.top;
    const { theme } = useTheme();
    const { selectedDate, setSelectedDate } = useEdt();
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    const { salle: salleParam } = useLocalSearchParams<{ salle: string }>();

    const [viewMode, setViewMode] = useState<ViewMode>('daily');
    const BOTTOM_PADDING = useBottomTabBarHeight() - useSafeAreaInsets().bottom;

    const [salle, setSalle] = useState<string>('602_b');

    useEffect(() => {
        if (salleParam) {

            const normalizedParam = salleParam.toLowerCase().startsWith('s') ? salleParam.slice(1).toLowerCase() : salleParam.toLowerCase();
            
            const foundSalle = Object.keys(salleInfo).find(s => 
                s.toLowerCase() === normalizedParam || 
                normalizedParam.includes(s.toLowerCase()) ||
                s.toLowerCase().includes(normalizedParam)
            );

            if (foundSalle) {
                setSalle(foundSalle);
            }
        }
    }, [salleParam]);
    const [events, setEvents] = useState<ICalEvent[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const modalPositionY = useRef(new Animated.Value(screenHeight)).current;

    // Chargement des données de la salle
    useEffect(() => {
        const loadSalleEvents = async () => {
            if (!salle) return;
            setLoading(true);
            try {
                const fetchedEvents = await HyperplanningApi.getSalleAPI(salle);
                setEvents(fetchedEvents);
            } catch (error) {
                console.error("Erreur chargement salle:", error);
                setEvents([]);
            } finally {
                setLoading(false);
            }
        };

        loadSalleEvents();
    }, [salle]);

    const openModal = (modalType: ModalType) => {
        setActiveModal(modalType);
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

    const handleSalleSelection = (selectedSalle: string) => {
        setSalle(selectedSalle);
        closeModal();
    };

    const toggleViewMode = () => {
        setViewMode(prev => prev === 'daily' ? 'weekly' : 'daily');
    };

    // Swipe Gestures
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
                        onPress={() => openModal('salle')}
                        activeOpacity={0.6}
                        style={[styles.groupSelector, { backgroundColor: theme.colors.secondary + '15' }]}
                    >
                        <Ionicons name="business" size={18} color={theme.colors.primary} style={{ marginRight: 6 }} />
                        <Text style={[styles.groupText, { color: theme.text.base }]} numberOfLines={1}>
                            {salle ? `Salle ${salle.slice(0, 3)}` : "Sélectionner"}
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
                    {loading ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: theme.text.base }}>Chargement...</Text>
                        </View>
                    ) : (
                        viewMode === 'daily'
                            ? <EventList data={events} />
                            : <WeeklySchedule data={events} />
                    )}
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
                )}
            />

            <CustomModal
                visible={activeModal === 'salle'}
                onClose={closeModal}
                backgroundColor={theme.bg.base}
                primaryColor={theme.colors.primary}
                secondaryColor={theme.colors.secondary}
                headerTitle="Sélection de la salle"
                actionButtonLabel=""
                renderContent={() => (
                    <FlatList
                        contentContainerStyle={{ paddingBottom: screenHeight * 0.1 }}
                        data={Object.keys(salleInfo)}
                        keyExtractor={(item) => item}
                        renderItem={({ item, index }) => (
                            <TouchableOpacity
                                style={{
                                    padding: 15,
                                    backgroundColor: (salle === item) ? theme.colors.primary : ((index % 2) === 0) ? theme.bg.tabBarActive + "20" : theme.bg.tabBarActive + "10",
                                }}
                                onPress={() => handleSalleSelection(item)}
                            >
                                <Text style={{ color: theme.text.base }}>{item.slice(0, 3)}</Text>
                            </TouchableOpacity>
                        )}
                    />
                )}
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
});

export default Page;
