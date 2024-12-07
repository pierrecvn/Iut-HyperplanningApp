import React, { useEffect, useRef } from 'react';
import {
	Animated,
	Dimensions,
	Modal,
	PanResponder,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import {Ionicons} from "@expo/vector-icons";

type CustomModalProps = {
	visible: boolean;
	onClose: () => void;
	renderContent: () => React.ReactNode;
	headerTitle?: string;
	backgroundColor?: string;
	primaryColor?: string;
	secondaryColor?: string;
	actionButtonLabel?: string;
	onActionButtonPress?: () => void;
};

const CustomModal = ({
	visible,
	onClose,
	renderContent,
	headerTitle,
	backgroundColor = '#FFF',
	primaryColor = '#000',
	secondaryColor = '#555',
	actionButtonLabel,
	onActionButtonPress,
} :CustomModalProps ) => {
	const { height: screenHeight, width :screenWeight} = Dimensions.get('window');
	const modalPositionY = useRef(new Animated.Value(screenHeight)).current;

	useEffect(() => {
		if (visible) {
			Animated.timing(modalPositionY, {
				toValue: 0,
				duration: 0,
				useNativeDriver: true,
			}).start();
		}
	}, [visible]);

	const closeModal = () => {
		Animated.timing(modalPositionY, {
			toValue: screenHeight,
			duration: 0,
			useNativeDriver: true,
		}).start(() => {
			onClose();
		});
	};

	const panResponder = PanResponder.create({
		onStartShouldSetPanResponder: () => true,
		onPanResponderMove: (_, gesture) => {
			modalPositionY.setValue(Math.max(0, gesture.dy));
		},
		onPanResponderRelease: (_, gesture) => {
			if (gesture.dy > 100) {
				closeModal();
			} else {
				Animated.spring(modalPositionY, {
					toValue: 0,
					useNativeDriver: true,
					damping: 15,
					mass: 1,
					stiffness: 150,
				}).start();
			}
		},
	});

	return (

		<Modal visible={visible} transparent={true} onRequestClose={closeModal} animationType="fade">
			<TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeModal}>
				<Animated.View
					style={[
						styles.modalContainer,
						{
							transform: [{ translateY: modalPositionY }],
							backgroundColor
						}
					]}
					{...panResponder.panHandlers}
				>
					<View style={styles.modalHandle} />

					<View style={[styles.modalHeader,]}>
						<View style={{ flex:1 , width: screenWeight }}>
							<Text style={[styles.modalTitle, { color: secondaryColor }]}>
								{headerTitle}
							</Text>

						</View>
						<View style={[styles.headerButtons]}>
							{actionButtonLabel && (
								<TouchableOpacity
									style={styles.actionButton}
									onPress={onActionButtonPress}
								>
									<Text style={[styles.actionButtonText, { color: primaryColor }]}>
										{actionButtonLabel}
									</Text>
								</TouchableOpacity>
							)}

							<TouchableOpacity
								style={styles.closeButton}
								onPress={closeModal}
							>

								<Ionicons name={'close-circle'}	size={24} color={primaryColor} />
								{/*<Text style={[styles.closeButtonText, { color: primaryColor }]}>*/}
								{/*	Fermer*/}
								{/*</Text>*/}
							</TouchableOpacity>
						</View>
					</View>

					<View style={styles.modalContent}>
						{renderContent()}
					</View>
				</Animated.View>
			</TouchableOpacity>
		</Modal>
	);
};

const styles = StyleSheet.create({
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
		justifyContent: 'space-around',
		alignItems: 'center',
		marginBottom: 20,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: 'bold',
	},
	headerButtons: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		alignItems: 'center',
	},
	actionButton: {
		marginRight: 15,
	},
	actionButtonText: {
		fontSize: 16,
		fontWeight: '500',
	},
	closeButton: {
		padding: 8,
	},
	closeButtonText: {
		fontSize: 16,
		fontWeight: '500',
	},
});

export default CustomModal;


