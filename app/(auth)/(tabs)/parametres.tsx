import CustomModal from '@/components/CustomModal';
import SettingItem from "@/components/SettingItem";
import { useAuth } from '@/context/AuthContext';
import { useEdt } from "@/context/EdtContext";
import { useTheme } from '@/context/ThemeContext';
import { UserData } from "@/interfaces/UserData";
import {getNotificationStatus, removeUserAllData, saveNotificationStatus} from "@/functions/supabase";
import groupInfo from '@/functions/utils/edtInfo.json';
import packageJson from '@/package.json';
import { Ionicons } from "@expo/vector-icons";
import { useHeaderHeight } from '@react-navigation/elements';
import 'dayjs/locale/fr';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FlatList, ScrollView, } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {NotificationService} from "@/functions/NotificationService";
import * as Notifications from "expo-notifications";
import {useBottomTabBarHeight} from "@react-navigation/bottom-tabs";
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
dayjs.locale('fr');

const { height: screenHeight } = Dimensions.get('window');


type ModalType = 'group' | 'calendar' | 'info' | 'rappel' | 'warning' | null;

const Page = () => {
	const insets = useSafeAreaInsets();
	const headerHeight = useHeaderHeight() - insets.top;
	const { theme, isDark, toggleTheme, useSystemTheme, isSystemTheme, useRandomTheme, isRandomTheme} = useTheme();
	const BOTTOM_PADDING = useBottomTabBarHeight() - insets.bottom;
	const { defaultGroupEvents} = useEdt()

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

				if (isNotificationEnabled  && scheduled.length === 0) {
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

					<View style={styles.separator}/>

					<SettingItem
						icon="notifications-outline"
						title="Rappels"
						description={`Fréquence de rappel: ${rappel} minutes`}
						onPress={() => setActiveModal('rappel')}
						controlType="button"
						disabled={!notificationStatus}
					/>
				</View>

				<Text style={[styles.headerTitle, { color: theme.text.base }]}>Autres</Text>

				<View style={[styles.settingsContainer, {
					backgroundColor: theme.bg.alarme,
					minWidth: screenWidth * 0.9
				}]}>



					<SettingItem
						icon="people-outline"
						title="Groupe"
						description="Changer votre groupe par défaut"
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
						icon="moon-outline"
						title="Theme système"
						description="Activer le thème sombre de l'application"
						value={isSystemTheme}
						onValueChange={useSystemTheme}
						controlType="switch"
					/>
					<SettingItem
						icon="shuffle-outline"
						title="Thème aléatoire"
						description="Activer un thème choisi aléatoirement parmi les thèmes disponibles"
						value={isRandomTheme}
						onValueChange={useRandomTheme}
						controlType="switch"
					/>



					<View style={styles.separator} />

					<SettingItem
						icon="information-circle-outline"
						title="À propos"
						description="Informations sur l'application"
						controlType="icon"
						rightIcon="open-outline"
						onPress={() => { setActiveModal('info') }}
					/>
				</View>



				<Text style={[styles.headerTitle, { color: theme.colors.danger }]}>Danger</Text>

				<View style={[styles.settingsContainer, {
					backgroundColor: theme.bg.alarme,
					minWidth: screenWidth * 0.9
				}]}>

					<SettingItem
						icon="warning-outline"
						title="Se déconnecter"
						description="Se déconnecter de votre compte"
						value={user ? true : false}
						onValueChange={deconnexion}
						controlType="icon"
						rightIcon={'log-out-outline'}
						// disabled={true}
						onPress={() => { deconnexion() }}
					/>


					{user ? (
						<View style={[styles.settingItem, { flexDirection: 'column', alignItems: 'flex-start' }]}>
							<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
								<Image
									source={{ uri: user.avatar_url }}
									style={{
										height: 50,
										width: 50,
										borderRadius: 10,
										marginRight: 10
									}}
								/>
								<View>
									<Text style={[styles.settingTitle, { color: theme.text.base }]}>
										{data?.full_name}
									</Text>
									<Text style={[styles.settingDescription, { color: theme.text.secondary }]}>
										{data?.email}
									</Text>
								</View>
							</View>

							<Text style={[styles.settingDescription, { color: theme.text.secondary }]}>
								Discord ID: {data?.sub}
							</Text>

							<Text style={[styles.settingDescription, { color: theme.text.secondary }]}>
								Nombre de requêtes : {data?.api_requests_count}
							</Text>

							<Text style={[styles.settingDescription, { color: theme.text.secondary }]}>
								Compte créé le: {data?.created_at ? dayjs(data.created_at).format('DD MMMM YYYY') : 'Inconnue'}
							</Text>

							<Text style={[styles.settingDescription, { color: theme.text.secondary }]}>
								Dernière connexion: {data?.updated_at ? dayjs(data.updated_at).format('DD MMMM YYYY [à] HH:mm') : 'Inconnue'}
							</Text>


							<View style={styles.separator} />

							<SettingItem
								icon="warning-outline"
								title="Suppression totales des données"
								description="Supprimer toutes vos données de l'application et de la base de donnée"
								value={user ? true : false}
								// onValueChange={removeUserAllData}
								onValueChange={() => setActiveModal('warning')}
								controlType="icon"
								rightIcon={'trash-outline'}
								customStyle={{ color: theme.colors.danger }}
								onPress={async () => {
									setActiveModal('warning');
								}}
							/>
						</View>
					) : null}
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
								<Text style={[{ fontWeight: '900', fontSize: 14}]}>
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
		fontSize: 24,
		fontWeight: 'bold',
		paddingBottom: 10,
		paddingLeft: 20,
		// paddingTop: 20,
	},
	settingsContainer: {
		padding: 15,
		borderRadius: 12,
		marginBottom: 20,
	},
	settingItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		paddingVertical: 8,
	},
	settingTexts: {
		flex: 1,
	},
	settingTitle: {
		fontSize: 16,
		fontWeight: '500',
	},
	settingDescription: {
		fontSize: 14,
	},
	switchContainer: {
		justifyContent: 'center',
		alignItems: 'center',
		paddingLeft: 10,
	},
	separator: {
		height: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.1)',
		marginVertical: 8,
	},
	groupItem: {
		padding: 15,
	},
});

export default Page;

