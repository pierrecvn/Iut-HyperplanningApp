import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type RoundBtnProps = {
	icon: typeof Ionicons.defaultProps;
	text: string;
	hasIcon: boolean;
	widthCircle?: number;
	stylesCustomBtn?: any;
	stylesCustomLabel?: any;
	onPress?: () => void;
};

const RoundBtn = ({ icon, text, onPress, hasIcon, widthCircle = 0.8, stylesCustomBtn, stylesCustomLabel }: RoundBtnProps) => {

	const { theme } = useTheme();

	const { width: screenWidth } = Dimensions.get('window');

	const styles = StyleSheet.create({
		container: {
			alignItems: 'center',
			gap: 10,
		},
		circle: {
			width: hasIcon ? 50 : screenWidth * widthCircle,
			height: 50,
			borderRadius: 20,
			backgroundColor: theme.colors.primary,
			justifyContent: 'center',
			alignItems: 'center',
		},
		label: {
			fontSize: 16,
			fontWeight: '500',
			color: theme.colors.secondary,
		},
	});

	return (
		<TouchableOpacity style={styles.container} onPress={onPress}>
			<View style={[styles.circle, stylesCustomBtn]}>
				{
					hasIcon ? (
						<Ionicons name={icon} size={24} color={theme.colors.secondary} />
					) : (
						<Text style={[styles.label, stylesCustomLabel]}>{text}</Text>
					)
				}
			</View>
		</TouchableOpacity >
	);
};

export default RoundBtn;