import React from "react";
import { Dimensions, StyleSheet, View, Image } from "react-native";

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
			resizeMode: 'contain', // Ajuste l'image pour qu'elle soit entièrement visible
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