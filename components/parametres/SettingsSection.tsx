import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { Dimensions, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

type SettingsSectionProps = {
    title: string;
    /** Par défaut theme.text.base. La section « Zone de Danger » passe theme.colors.danger. */
    titleColor?: string;
    style?: StyleProp<ViewStyle>;
    children: React.ReactNode;
};

/**
 * Un titre et la carte qui regroupe des SettingItem.
 *
 * Existe pour que les styles headerTitle, settingsContainer et separator
 * vivent à un seul endroit : la section « Général » mélange plusieurs
 * fonctionnalités dans un même conteneur, donc les composants extraits
 * rendent des fragments de SettingItem sans jamais rendre leur propre
 * conteneur.
 */
export function SettingsSection({ title, titleColor, style, children }: SettingsSectionProps) {
    const { theme } = useTheme();

    return (
        <>
            <Text style={[styles.headerTitle, { color: titleColor ?? theme.text.base }]}>
                {title}
            </Text>
            <View
                style={[
                    styles.settingsContainer,
                    { backgroundColor: theme.bg.alarme, minWidth: screenWidth * 0.9 },
                    style,
                ]}
            >
                {children}
            </View>
        </>
    );
}

/** Le trait fin qui sépare deux SettingItem à l'intérieur d'une section. */
export function SettingsSeparator() {
    return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        paddingBottom: 10,
        paddingLeft: 4,
        opacity: 0.8,
    },
    settingsContainer: {
        padding: 10,
        borderRadius: 16,
        marginBottom: 20,
    },
    separator: {
        height: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        marginVertical: 4,
    },
});
