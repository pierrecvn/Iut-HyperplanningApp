import { useTheme } from '@/context/ThemeContext';
import { StyleSheet, Animated, TouchableOpacity, View } from 'react-native';
import { useEffect, useRef } from 'react';
import {Ionicons} from "@expo/vector-icons";

interface SwitchProps {
	value: boolean;
	onValueChange: (value: boolean) => void;
	disabled?: boolean;
}

const SwitchBtn = ({ value, onValueChange, disabled = false }: SwitchProps) => {
	const { theme } = useTheme();
	const translateX = useRef(new Animated.Value(0)).current;
	const { width, height, circle } = { width: 60, height: 32, circle:25 };

	useEffect(() => {
		Animated.spring(translateX, {
			toValue: value ? width - circle - 4 : 4,
			useNativeDriver: true,
			bounciness: 4,
		}).start();
	}, [value]);

	const styles = StyleSheet.create({
		container: {
			width: width,
			height: height,
			borderRadius: height / 4,
			justifyContent: 'center',
			backgroundColor: value ? theme.colors.primary : theme.colors.secondary,
			opacity: disabled ? 0.5 : 1,
		},
		circle: {
			width: circle,
			height: circle,
			borderRadius: circle / 4,
			backgroundColor:value ? theme.colors.secondary : theme.bg.base,
		},
	});

	return (
		<TouchableOpacity
			activeOpacity={0.8}
			onPress={() => !disabled && onValueChange(!value)}
			style={styles.container}
		>
			<Animated.View
				style={[
					styles.circle,
					{
						transform: [{
							translateX,
						}],
						alignItems: 'center',
						justifyContent: 'center',
					},
				]}
			>
				<Ionicons name={value ? 'checkmark' : 'close'} size={circle - 4} color={theme.text.base} />
			</Animated.View>

		</TouchableOpacity>
	);
};

export default SwitchBtn;