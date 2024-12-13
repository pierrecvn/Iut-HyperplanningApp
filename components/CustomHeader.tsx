import {useTheme} from '@/context/ThemeContext'
import {MaterialIcons} from '@expo/vector-icons'
import React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {TouchableOpacity} from 'react-native-gesture-handler'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Link, router} from "expo-router";

type HeaderProps = {
	title?: string;
	viewCustom?: React.ReactNode;
	onPress?: () => void;
};

const CustomHeader = ({title, viewCustom}: HeaderProps) => {
	const {top} = useSafeAreaInsets();
	const {theme} = useTheme();

	const styles = StyleSheet.create({
		container: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			gap: 10,
			height: 60,
			backgroundColor: theme.bg.base,
			paddingHorizontal: 20,
		}
	});

	return (
		<View style={{paddingTop: top}}>
			<View style={styles.container}>
				{viewCustom ? viewCustom : <Text style={{
					color: theme.text.base,
					fontWeight: '900',
					fontSize: 30,
					fontFamily: 'Inter',
					fontStyle: 'normal'
				}}>{title}</Text>}

				{/*<Link href={'/(auth)/notifications'} asChild>*/}
				{/*	<TouchableOpacity>*/}
				{/*		<MaterialIcons name="notifications-none" size={32} color={theme.text.base}/>*/}
				{/*	</TouchableOpacity>*/}
				{/*</Link>*/}
				{/*<TouchableOpacity onPress={ () => {*/}

				{/*	console.log(supabase.rpc('trie_par_groupe', { groupe: 'F' }).then(response => {*/}
				{/*			if (response.error) {*/}
				{/*				console.error('Error:', response.error);*/}
				{/*			} else {*/}
				{/*				console.log('Result:', response.data);*/}
				{/*			}*/}
				{/*		}))*/}


				{/*}}>*/}
				{/*	<MaterialIcons name="notifications-none" size={32} color={theme.text.base} />*/}

				{/*</TouchableOpacity>*/}
			</View>
		</View>
	);
}

export default CustomHeader;