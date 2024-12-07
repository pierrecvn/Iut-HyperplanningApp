import { useEdt } from '@/context/EdtContext';
import { useUpdate } from '@/context/UpdateContext';
import { useTheme } from '@/context/ThemeContext';
import { useHeaderHeight } from '@react-navigation/elements';
import React, { useEffect } from 'react';
import {Dimensions, StyleSheet, Text, View} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {useBottomTabBarHeight} from "@react-navigation/bottom-tabs";
import EventList from "@/components/EventList";

const Page = () => {
	const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
	const insets = useSafeAreaInsets();
	const headerHeight = useHeaderHeight() - insets.top;
	const BOTTOM_PADDING = useBottomTabBarHeight() - useSafeAreaInsets().bottom;
	const { theme } = useTheme();
	const { checkUpdatesAndApi } = useUpdate();
	const { selectedDate, setSelectedDate, refreshEdt, getCoursSuivant} = useEdt();

	useEffect(() => {
		checkUpdatesAndApi();
	}, []);

	// const nextEvent = getCoursSuivant();


	return <SafeAreaView
		style={[
			styles.container,
			{
				backgroundColor: theme.bg.base,
				paddingTop: headerHeight,
				paddingBottom: BOTTOM_PADDING
			}
		]}
	>

		{/*<View style={{ flex: 1, flexDirection: "column" }}>*/}
		{/*	<View style={{}}>*/}

		{/*		<Text style={{ color: theme.text.base, fontWeight: '900', fontSize: 30, fontFamily: 'Inter', fontStyle: 'normal' }}>Prochains cours : </Text>*/}

		{/*		<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>*/}
		{/*			<Text style={{ color: theme.text.base, fontWeight: '900', fontSize: 20, fontFamily: 'Inter', fontStyle: 'normal' }}>{nextEvent?.summary}</Text>*/}
		{/*			/!*<Text style={{ color: theme.text.base, fontWeight: '900', fontSize: 20, fontFamily: 'Inter', fontStyle: 'normal' }}>{(nextEvent?.start)}</Text>*!/*/}
		{/*		</View>*/}



		{/*	</View>*/}
		{/*	<EventList nb="3" />*/}

		{/*</View>*/}

	</SafeAreaView>;
};

export default Page;

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
	},
});