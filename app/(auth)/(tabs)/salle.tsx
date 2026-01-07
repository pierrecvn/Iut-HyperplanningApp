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
import { FlatList } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from 'react-native-ui-datepicker';

type ModalType = 'salle' | 'calendar' | null;
type ViewMode = 'daily' | 'weekly';

const Page = () => {
    const insets = useSafeAreaInsets();
    const headerHeight = useHeaderHeight() - insets.top;
    const { theme } = useTheme();
    const { selectedDate, setSelectedDate } = useEdt();
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

    const [viewMode, setViewMode] = useState<ViewMode>('daily');
    const BOTTOM_PADDING = useBottomTabBarHeight() - useSafeAreaInsets().bottom;

    const [salle, setSalle] = useState<string>('602_b'); // Salle par défaut
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

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.bg.base, paddingTop: headerHeight, paddingBottom: BOTTOM_PADDING }]}>
            <View style={styles.dateNavigation}>
                <RoundBtn
                    widthCircle={0.5}
                    hasIcon
                    icon="chevron-back"
                    text="-"
                    onPress={jourPrc}
                />

                <TouchableOpacity
                    onPress={() => openModal('calendar')}
                    activeOpacity={0.4}
                    style={[styles.dateContainer, {
                        backgroundColor: theme.colors.secondary,
                        width: screenWidth * 0.55,
                        height: 50
                    }]}
                >
                    <Text style={styles.dateText}>
                        {formatDate(selectedDate)}
                    </Text>
                </TouchableOpacity>

                <RoundBtn
                    widthCircle={0.5}
                    hasIcon
                    icon="chevron-forward"
                    text="-"
                    onPress={jourSvt}
                />
            </View>

            <View style={styles.headerContainer}>
                <TouchableOpacity
                    onPress={() => openModal('salle')}
                    activeOpacity={0.4}
                    style={[styles.dateContainer, {
                        backgroundColor: theme.colors.secondary,
                        width: screenWidth * 0.7,
                        height: 50
                    }]}
                >
                    <Text style={styles.dateText}>
                        SALLE - {salle.slice(0, 3)}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={toggleViewMode}
                    style={[styles.viewModeButton, {
                        backgroundColor: theme.colors.secondary,
                    }]}
                >
                    <Ionicons
                        name={viewMode === 'daily' ? 'calendar-outline' : 'today-outline'}
                        size={24}
                        color="black"
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.eventListContainer}>
                {loading ? (
                    <Text style={{ color: theme.text.base, marginTop: 20 }}>Chargement...</Text>
                ) : (
                    viewMode === 'daily'
                        ? <EventList data={events} />
                        : <WeeklySchedule data={events} />
                )}
            </View>

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
    dateNavigation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        padding: 10,
        position: 'relative',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        padding: 10,
    },
    dateContainer: {
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewModeButton: {
        width: 50,
        height: 50,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateText: {
        fontSize: 18,
        fontFamily: 'Inter',
        fontWeight: '900',
        color: '#000'
    },
    eventListContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default Page;
