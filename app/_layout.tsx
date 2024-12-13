import {AuthProvider, useAuth} from '@/context/AuthContext';
import {UpdateProvider} from '@/context/UpdateContext';
import {UserInactivityProvider} from '@/context/UserInactivity';
import {ThemeProvider} from '@/context/ThemeContext';
import {EdtProvider, useEdt} from '@/context/EdtContext';
import {FontAwesome, Ionicons} from '@expo/vector-icons';
import {useFonts} from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
import {SplashScreen, Stack, useRouter, useSegments} from 'expo-router';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {TouchableOpacity} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {NotificationService} from "@/functions/NotificationService";
import {getNotificationStatus} from "@/functions/supabase";

SplashScreen.preventAutoHideAsync();

const RootNavigator = () => {
	return (
		<Stack>
			<Stack.Screen
				name="index"
				options={{
					headerShown: false,
					navigationBarColor: "transparent",
				}}
			/>
			<Stack.Screen
				name="login"
				options={{
					headerShown: false,
					navigationBarColor: "transparent",
				}}
			/>
			<Stack.Screen name="(auth)/notifications" options={{
				title: 'Notifications',
				presentation: 'modal',
				headerBackTitle: '',
				headerShadowVisible: false,
				headerLeft: () => (
					<TouchableOpacity onPress={useRouter().back}>
						<Ionicons name="arrow-back" size={34} />
					</TouchableOpacity>
				)
			}}/>
			<Stack.Screen name="(auth)/(tabs)" options={{
				headerShown: false,
				navigationBarColor: "transparent",
			}}/>
		</Stack>
	);
};

const RootLayoutContent = () => {
	const [loaded, error] = useFonts({
		...FontAwesome.font,
	});

	const router = useRouter();
	const [isMounted, setIsMounted] = useState(false);
	const [isAuthChecked, setIsAuthChecked] = useState(false);
	const {user, loading, checkUser} = useAuth();
	const { allEvents } = useEdt();

	// opti des notifications
	const shouldInitializeNotifications = useMemo(() => {
		return !!user?.rappel && !!user?.group && allEvents.length > 0;
	}, [user, allEvents]);

	const initializeNotifications = useCallback(async () => {

		const storedStatus = getNotificationStatus();

		if (!shouldInitializeNotifications || !storedStatus) return;

		try {
			const permission = await NotificationService.initNotifications();
			// console.log('Permission:', permission);

			if (permission) {
				// console.log('Planification des notifications');
				await NotificationService.planifierNotificationsEvents(allEvents, user?.rappel);
			}
		} catch (error) {
			console.error('Erreur lors de l\'initialisation des notifications:', error);
		}
	}, [shouldInitializeNotifications, allEvents, user]);

	const notificationsInitialized = useRef(false);


	useEffect(() => {
		const setNavBarColor = async () => {
			await NavigationBar.setPositionAsync('absolute');
			await NavigationBar.setBackgroundColorAsync('transparent');
		};
		setNavBarColor();
		if (error) throw error;
	}, [error]);

	// Suivi du chargement des polices
	useEffect(() => {
		if (loaded) {
			setIsMounted(true);
		}
	}, [loaded]);

	// Vérification de l'authentification
	const [isCheckingAuth, setIsCheckingAuth] = useState(false);

	useEffect(() => {
		if (isMounted && !isAuthChecked && !isCheckingAuth) {
			const performAuthCheck = async () => {
				setIsCheckingAuth(true);
				try {
					await checkUser();
					setIsAuthChecked(true);
				} finally {
					setIsCheckingAuth(false);
				}
			};
			performAuthCheck();
		}
	}, [isMounted, checkUser, isAuthChecked, isCheckingAuth]);

	const segments = useSegments();

	useEffect(() => {
		if (isAuthChecked) {
			if (user) {
				if (segments[0] !== '(auth)') {
					router.replace('/(auth)/(tabs)/home');
				}
			} else {
				router.replace('/login');
			}
		}
	}, [user, router, isAuthChecked, segments]);

	const [splashHidden, setSplashHidden] = useState(false);

	useEffect(() => {
		if (!loaded || loading || !isMounted || !isAuthChecked) return;

		if (!splashHidden) {
			SplashScreen.hideAsync();
			setSplashHidden(true);
		}
	}, [loaded, loading, isMounted, isAuthChecked, splashHidden]);

	// Initialisation des notifications
	useEffect(() => {
		if (!notificationsInitialized.current && shouldInitializeNotifications) {
			initializeNotifications();
			notificationsInitialized.current = true;
		}
	}, [shouldInitializeNotifications, initializeNotifications]);

	return (
		<GestureHandlerRootView style={{flex: 1}}>
			<RootNavigator/>
		</GestureHandlerRootView>
	);
};

export default function RootLayout() {
	return (
		<ThemeProvider>
			<AuthProvider>
				<UpdateProvider>
					<EdtProvider>
						<UserInactivityProvider>
							<RootLayoutContent/>
						</UserInactivityProvider>
					</EdtProvider>
				</UpdateProvider>
			</AuthProvider>
		</ThemeProvider>
	);
}