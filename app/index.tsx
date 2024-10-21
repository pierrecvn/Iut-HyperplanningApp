import DiscordLogin from "@/components/DiscordLogin";
import EventList from "@/components/EventList";
import * as Updates from "expo-updates";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, SafeAreaView, StyleSheet, Text, View } from "react-native";

let dev = process.env.NODE_ENV === 'development';

export default function Index() {
	const [modalVisible, setModalVisible] = useState(false);
	const [updateStatus, setUpdateStatus] = useState('');

	async function onFetchUpdateAsync() {
		try {
			setModalVisible(true);
			if (!dev) {

				setUpdateStatus('Recherche de mises à jour...');

				const update = await Updates.checkForUpdateAsync();

				if (update.isAvailable) {
					setUpdateStatus('Télechargement ...');
					await Updates.fetchUpdateAsync();
					setUpdateStatus('Rechargement...');
					await Updates.reloadAsync();
				} else {
					setUpdateStatus('Pas de nouvelles mise à jour');
					setTimeout(() => setModalVisible(false), 500);
				}
			} else {
				setUpdateStatus('Mode dev');
				setTimeout(() => setModalVisible(false), 200);
			}

		} catch (error: any) {
			setModalVisible(false);
			Alert.alert(`Error`, error.message);
		}
	}

	useEffect(() => {
		onFetchUpdateAsync();
	}, []);

	return (
		<View style={styles.container}>

			<DiscordLogin />


			<SafeAreaView style={{ flex: 1 }}>
				<EventList />
			</SafeAreaView>


			<Modal
				animationType="fade"
				transparent={true}
				visible={modalVisible}
				onRequestClose={() => setModalVisible(false)}
			>
				<View style={styles.centeredView}>
					<View style={styles.modalView}>
						<Text style={styles.modalText}>{updateStatus}</Text>
						<ActivityIndicator size="large" color="#FF0000" />
						<Text style={styles.infoText}>Garder l'application ouvert</Text>
					</View>
				</View>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	centeredView: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: 'rgba(0,0,0,0.5)',
	},
	modalView: {
		margin: 20,
		backgroundColor: "white",
		borderRadius: 20,
		padding: 35,
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2
		},
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5
	},
	modalText: {
		marginBottom: 15,
		textAlign: "center",
		fontSize: 18,
		fontWeight: "bold",
	},
	infoText: {
		marginTop: 10,
		fontSize: 14,
		color: "#666",
	},
});