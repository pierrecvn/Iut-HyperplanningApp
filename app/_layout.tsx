import {AuthProvider, useAuth} from '@/context/AuthContext';
import {UpdateProvider} from '@/context/UpdateContext';
import {UserInactivityProvider} from '@/context/UserInactivity';
import {ThemeProvider} from '@/context/ThemeContext';
import {EdtProvider} from '@/context/EdtContext';
import {FontAwesome, Ionicons} from '@expo/vector-icons';
import {useFonts} from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
import {SplashScreen, Stack, useRouter, useSegments} from 'expo-router';
import React, {useEffect, useState} from 'react';
import {ActivityIndicator, TouchableOpacity, View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

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
						<Ionicons name="arrow-back" size={34} color={"#fff"}/>
					</TouchableOpacity>
				),
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
	useEffect(() => {
		const setNavBarColor = async () => {
			await NavigationBar.setPositionAsync('absolute');
			await NavigationBar.setBackgroundColorAsync('transparent');
		};
		setNavBarColor();
		if (error) throw error;
	}, [error]);


	const router = useRouter();
	const [isMounted, setIsMounted] = useState(false);
	const [isAuthChecked, setIsAuthChecked] = useState(false);
	const {user, loading, checkUser} = useAuth();

	useEffect(() => {
		// console.log('Loaded:', loaded);
		if (loaded) {
			setIsMounted(true);
		}
	}, [loaded]);

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
			// console.log(segments);
			if (user) {
				if (segments[0] !== '(auth)') {
					router.replace('/(auth)/(tabs)/home');
				}

			} else {
				// console.log("go /login")
				router.replace('/login'); // ne rien faire car la route de base c'est /index
			}

		}
	}, [user, router, isAuthChecked]);

	const [splashHidden, setSplashHidden] = useState(false);

	useEffect(() => {
		if (!loaded || loading || !isMounted || !isAuthChecked) return;

		if (!splashHidden) {
			// console.log("Hiding SplashScreen - Loaded:", loaded, "Loading:", loading, "isMounted:", isMounted, "isAuthChecked:", isAuthChecked);
			SplashScreen.hideAsync();
			setSplashHidden(true);
		}
	}, [loaded, loading, isMounted, isAuthChecked, splashHidden]);

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
