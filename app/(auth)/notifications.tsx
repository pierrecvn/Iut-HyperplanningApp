import {useTheme} from '@/context/ThemeContext';
import {useHeaderHeight} from '@react-navigation/elements';
import React, {useEffect, useRef, useState} from 'react';
import {Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useBottomTabBarHeight} from "@react-navigation/bottom-tabs";


const Notification = () => {
	const insets = useSafeAreaInsets();
	const headerHeight = useHeaderHeight() - insets.top;
	const {theme} = useTheme();
	const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
	// const BOTTOM_PADDING = useBottomTabBarHeight() - useSafeAreaInsets().bottom;


	return (
		<SafeAreaView style={[styles.container, {
			backgroundColor: theme.bg.base,
			paddingTop: headerHeight,
			// paddingBottom: BOTTOM_PADDING
		}]}>

		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	}
});

export default Notification;