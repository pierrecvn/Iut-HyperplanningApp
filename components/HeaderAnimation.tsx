import React, { useEffect, useState } from 'react';
import { Animated, Text, View, Image, StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import CustomHeader from '@/components/CustomHeader';
import {useTheme} from "@/context/ThemeContext";

const HeaderAnimation = () => {
	const { user } = useAuth();
	const { theme } = useTheme();
	const emojiOpacity = useState(new Animated.Value(0))[0];

	useEffect(() => {
		Animated.loop(
			Animated.sequence([
				Animated.timing(emojiOpacity, {
					toValue: 1,
					duration: 2000,
					useNativeDriver: true,
				}),
				Animated.timing(emojiOpacity, {
					toValue: 0,
					duration: 1000,
					useNativeDriver: true,
				}),
			])
		).start();
	}, [emojiOpacity]);

	return (
		<CustomHeader
			viewCustom={
			<View style={styles.container}>
				<View style={styles.leftSection}>
					<Text style={[styles.title, { color: theme.text.base }]}>
						Menu
					</Text>
					<Animated.Text style={{ opacity: emojiOpacity, fontSize: 22, marginLeft: 8 }}>
						👋
					</Animated.Text>
				</View>
				
				{user?.avatar_url && (
					<Image 
						source={{ uri: user.avatar_url }} 
						style={[styles.avatar, { borderColor: theme.colors.primary + '30' }]} 
					/>
				)}
			</View>
			}/>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		flex: 1,
	},
	leftSection: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	title: {
		fontWeight: '900',
		fontSize: 30,
		fontFamily: 'Inter',
	},
	avatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
		borderWidth: 2,
	}
});

export default HeaderAnimation;