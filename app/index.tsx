import React, { useEffect } from "react";
import { Dimensions, StyleSheet, View, Image, Modal, Text, ActivityIndicator } from "react-native";
import { useUpdate } from "@/context/UpdateContext";

export default function Index() {
	const { modalVisible, updateStatus, updateDetails, checkUpdatesAndApi } = useUpdate();
	const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

	const styles = StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: "transparent",
			justifyContent: "center",
			alignItems: "center",
		},
		image: {
			width: "100%",
			height: "100%",
			resizeMode: "cover",
		},
		modalContainer: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
			backgroundColor: "rgba(0, 0, 0, 0.5)",
		},
		modalContent: {
			width: "80%",
			backgroundColor: "white",
			borderRadius: 10,
			padding: 20,
			alignItems: "center",
		},
		statusText: {
			fontSize: 16,
			fontWeight: "bold",
			marginBottom: 10,
		},
		detailsText: {
			fontSize: 14,
			color: "gray",
			textAlign: "center",
			marginBottom: 20,
		},
	});

	useEffect(() => {
		checkUpdatesAndApi();
	}, []);

	return (
		<View style={styles.container}>
			<Image
				source={require("@/assets/images/splash.png")}
				style={styles.image}
			/>
			<Modal visible={modalVisible} transparent>
				<View style={styles.modalContainer}>
					<View style={styles.modalContent}>
						<ActivityIndicator size="large" color="#0000ff" />
						<Text style={styles.statusText}>{updateStatus}</Text>
						<Text style={styles.detailsText}>{updateDetails}</Text>
					</View>
				</View>
			</Modal>
		</View>
	);
}
