// app/(auth)/_layout.tsx

import CustomHeader from '@/components/CustomHeader';
import { useTheme } from '@/context/ThemeContext';
import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';

import { Tabs } from 'expo-router';
import { Dimensions, StyleSheet, View } from 'react-native';
import HeaderAnimation from "@/components/HeaderAnimation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect } from "react";
import * as NavigationBar from "expo-navigation-bar";
import { useAuth } from "@/context/AuthContext";


const Layout = () => {
    const { theme } = useTheme();

    return (
        <Tabs
            screenOptions={{
                tabBarHideOnKeyboard: true,
                tabBarActiveTintColor: theme.text.base,
                tabBarInactiveTintColor: theme.text.base,
                tabBarStyle: {
                    backgroundColor: theme.bg.tapBar,
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    elevation: 0,
                    paddingVertical: 10,
                    height: 70 + useSafeAreaInsets().bottom,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontFamily: 'Inter-light',
                    marginBottom: 5,
                },
            }}>
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Menu',
                    tabBarIcon: ({ size, color, focused }) => (
                        <View style={styles.iconContainer}>
                            {focused && (
                                <View style={[styles.focusBg, { backgroundColor: theme.bg.tabBarActive }]} />
                            )}
                            <AntDesign name="home" size={26} color={color} />
                        </View>
                    ),

                    header: () => <HeaderAnimation />,
                    headerTransparent: true,
                }}
            />

            <Tabs.Screen
                name="planning"
                options={{
                    title: 'Planning',
                    tabBarIcon: ({ size, color, focused }) => (
                        <View style={styles.iconContainer}>
                            {focused && (
                                <View style={[styles.focusBg, { backgroundColor: theme.bg.tabBarActive }]} />
                            )}
                            <Ionicons name="calendar-outline" size={26} color={color} />
                        </View>
                    ),
                    header: () => <CustomHeader title="Planning" />,
                    headerTransparent: true,
                }}
            />

            <Tabs.Screen
                name="salle"
                options={{
                    title: 'salle',
                    tabBarIcon: ({ size, color, focused }) => (
                        <View style={styles.iconContainer}>
                            {focused && (
                                <View style={[styles.focusBg, { backgroundColor: theme.bg.tabBarActive }]} />
                            )}
                            <Ionicons name="business-outline" size={26} color={color} />
                        </View>
                    ),
                    header: () => <CustomHeader title="Salle" />,
                    headerTransparent: true,
                }}
            />

			<Tabs.Screen
                name="parametres"
                options={{
                    title: 'Paramètres',
                    tabBarIcon: ({ size, color, focused }) => (
                        <View style={styles.iconContainer}>
                            {focused && (
                                <View style={[styles.focusBg, { backgroundColor: theme.bg.tabBarActive }]} />
                            )}
                            <Ionicons name="settings-outline" size={26} color={color} />
                        </View>
                    ),
                    header: () => <CustomHeader title="Paramètres" />,
                    headerTransparent: true,
                }}
            />
        </Tabs>
    );
};

const styles = StyleSheet.create({
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
    },
    focusBg: {
        borderRadius: 10,
        height: 26,
        width: 56,
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default Layout;
