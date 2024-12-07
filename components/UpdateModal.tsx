import { useUpdate } from '@/context/UpdateContext';
import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';

export const UpdateModal = () => {
	const { theme } = useTheme();
	const { modalVisible, updateStatus, updateDetails, setModalVisible } = useUpdate();

	return (
		<Modal
			animationType="fade"
			transparent={true}
			visible={modalVisible}
			onRequestClose={() => setModalVisible(false)}
		>
			<View style={styles.centeredView}>
				<View style={[styles.modalView, { backgroundColor: theme.bg.base }]}>
					<Text style={[styles.modalText, { color: theme.text.base }]}>{updateStatus}</Text>
					<ActivityIndicator size="large" color={theme.colors.primary} />
					<Text style={[styles.infoText, { color: theme.text.base }]}>{updateDetails}</Text>
				</View>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	centeredView: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: 'rgba(0,0,0,0.5)',
	},
	modalView: {
		margin: 20,
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
	},
});