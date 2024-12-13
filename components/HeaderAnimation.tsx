import React, { useEffect, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import CustomHeader from '@/components/CustomHeader';
import {useTheme} from "@/context/ThemeContext";

const HeaderAnimation = () => {
	const { user } = useAuth();
	const { theme } = useTheme();
	const [discordName, setDiscordName] = useState('');
	const emojiOpacity = useState(new Animated.Value(0))[0];

	useEffect(() => {
		if (user) {
			setDiscordName(user?.pseudo);
		}

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
	}, [user, emojiOpacity]);

	return (
		<CustomHeader
			// title='Menu'
			viewCustom={
			<View style={{ flexDirection: 'row', alignItems: 'center' }}>
				<Text style={{ color: theme.text.base, fontWeight: '900', fontSize: 30, fontFamily: 'Inter', fontStyle: 'normal' }}>
					Salut {discordName + " "}
				</Text>
				<Text style={{ color: theme.text.base, fontWeight: '900', fontSize: 30, fontFamily: 'Inter', fontStyle: 'normal' }}>
					( {user?.group} )
				</Text>
				<Animated.Text style={{ opacity: emojiOpacity, fontSize: 20, paddingLeft: 5 }}>
					👋
				</Animated.Text>

			</View>
			}/>
	);
};

export default HeaderAnimation;