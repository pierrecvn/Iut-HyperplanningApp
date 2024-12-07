import CustomModal from '@/components/CustomModal';
import EventList from '@/components/EventList';
import WeeklySchedule from '@/components/EventSemaine';
import RoundBtn from '@/components/RoundBtn';
import { useAuth } from '@/context/AuthContext';
import { useEdt } from '@/context/EdtContext';
import { useTheme } from '@/context/ThemeContext';
import groupInfo from '@/functions/utils/edtInfo.json';
import { Ionicons } from "@expo/vector-icons";
import { useHeaderHeight } from '@react-navigation/elements';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from 'react-native-ui-datepicker';
import {useBottomTabBarHeight} from "@react-navigation/bottom-tabs";

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
	const [activeModal, setActiveModal] = useState<ModalType>(null);
	const [isInitialGroupSelection, setIsInitialGroupSelection] = useState(false);
	const modalPositionY = useRef(new Animated.Value(screenHeight)).current;

	useEffect(() => {
		const initializeGroup = async () => {
			try {
				const data = await recupDataUtilisateur();
				if (data?.group == null) {
					setActiveModal('group');
					setIsInitialGroupSelection(true);
				} else {
					setGroup(data.group);
				}
			} catch (error) {
				console.error('Erreur Init groupe ', error);
			}
		};

		initializeGroup();
	}, []);

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

				<TouchableOpacity
					onPress={() => openModal('group')}
					activeOpacity={0.4}
					style={[styles.dateContainer, {
						backgroundColor: theme.colors.secondary,
						width: screenWidth * 0.7,
						height: 50
					}]}
				>
					<Text style={styles.dateText}>
						INFO - {group}
					</Text>
				</TouchableOpacity>


			</View>

			<View style={styles.eventListContainer}>
				{viewMode === 'daily' ? <EventList /> : <WeeklySchedule />}
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
				)}></CustomModal>

			<CustomModal
				visible={activeModal === 'group'}
				onClose={() => !isInitialGroupSelection && closeModal()}
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
				renderContent={() => (
					<FlatList
						data={Object.keys(groupInfo)}
						keyExtractor={(item) => item}
						renderItem={({ item, index }) => (
							<TouchableOpacity
								style={{
									padding: 15,
									backgroundColor: (group === item) ? theme.colors.primary : ((index % 2) === 0) ? theme.bg.tabBarActive + "20" : theme.bg.tabBarActive + "10",
								}}
								onPress={() => handleGroupSelection(item)}
							>
								<Text style={{ color: theme.text.base }}>{item}</Text>
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