import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Ionicons} from "@expo/vector-icons";
import SwitchBtn from "@/components/CustomSwitch";
import {useTheme} from '@/context/ThemeContext';

type ControlType = 'switch' | 'button' | 'icon';

interface SettingItemProps {
	icon?: keyof typeof Ionicons.glyphMap;
	title: string;
	description: string;
	disabled?: boolean;
	controlType: ControlType;
	value?: boolean;
	onValueChange?: (value: boolean) => void;
	onPress?: () => void;
	customStyle?: object;
	rightIcon?: keyof typeof Ionicons.glyphMap;
}

const SettingItem = ({
						 icon,
						 title,
						 description,
						 disabled = false,
						 controlType,
						 value: propValue,
						 onValueChange,
						 onPress,
						 customStyle,
						 rightIcon = 'chevron-forward',
					 }: SettingItemProps) => {
	const {theme} = useTheme();

	const [localValue, setLocalValue] = useState(propValue ?? false);

	const value = propValue ?? localValue;
	const handleValueChange = (newValue: boolean) => {
		if (disabled) return;

		if (onValueChange) {
			onValueChange(newValue);
		} else {
			setLocalValue(newValue);
		}
	};

	const opacity = disabled ? 0.5 : 1;

	const renderControl = () => {
		switch (controlType) {
			case 'switch':
				return (
					<SwitchBtn
						value={value}
						onValueChange={handleValueChange}
						disabled={disabled}
					/>
				);
			case 'button':
				return (
					<TouchableOpacity
						onPress={disabled ? undefined : onPress}
						disabled={disabled}
						style={[
							styles.button,
							{
								backgroundColor: theme.colors.primary,
								opacity,

							}
						]}
					>
						<Text style={[styles.buttonText, {color: theme.text.base}]}>
							Modifier
						</Text>
					</TouchableOpacity>
				);
			case 'icon':
				return (
					<Ionicons
						name={rightIcon}
						size={24}
						color={theme.text.base}
						style={[customStyle, {opacity}]}
						onPress={onPress}
					/>
				);
			default:
				return null;
		}
	};

	return (
		<TouchableOpacity
			style={[
				styles.settingItem,
				{opacity}
			]}
			onPress={() => {
				switch (controlType) {
					case 'switch':
						handleValueChange(!value);
						break;
					case 'button':
						onPress?.();
						break;
					case 'icon':
						onPress?.();
						break;
					default:
						break;
				}
			}
				}
			activeOpacity={0.8}
		>
			<Ionicons
				name={icon}
				size={24}
				color={theme.text.base}
				style={[customStyle, {opacity}]}
			/>
			<View style={styles.settingTexts}>
				<Text
					style={[
						styles.settingTitle,
						{color: theme.text.base},
						customStyle
					]}
				>
					{title}
				</Text>
				<Text
					style={[

						styles.settingDescription,
						{color: theme.text.secondary},
						customStyle
					]}
				>
					{description}
				</Text>
			</View>
			<View style={styles.controlContainer}>
				{renderControl()}
			</View>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	settingItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		paddingVertical: 8,
	},
	settingTexts: {
		flex: 1,
	},
	settingTitle: {
		fontSize: 16,
		fontWeight: '500',
	},
	settingDescription: {
		fontSize: 14,
	},
	controlContainer: {
		justifyContent: 'center',
		alignItems: 'center',
		paddingLeft: 10,
	},
	button: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 8,
	},
	buttonText: {
		fontSize: 14,
		fontWeight: '500',
	},
});

export default SettingItem;