import React, {useEffect} from "react";
import { Dimensions, StyleSheet, View, Image } from "react-native";
import * as Notifications from "expo-notifications";
import {useAuth} from "@/context/AuthContext";
import {useEdt} from "@/context/EdtContext";
import {NotificationService} from "@/functions/NotificationService";

export default function Index() {
	const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

	const styles = StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: 'transparent',
			justifyContent: 'center',
			alignItems: 'center',
		},
		image: {
			width: '100%',
			height: '100%',
			resizeMode: 'cover'
		}
	});


	return (
		<View style={styles.container}>
			<Image
				source={require('@/assets/images/splash.png')}
				style={styles.image}
			/>
		</View>
	);
}