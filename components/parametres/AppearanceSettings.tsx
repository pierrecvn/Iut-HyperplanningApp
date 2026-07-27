import SettingItem from '@/components/SettingItem';
import { useTheme } from '@/context/ThemeContext';
import React from 'react';

/**
 * Les trois bascules d'apparence.
 *
 * Aucun état propre : tout vient de ThemeContext. Le composant existe pour
 * sortir ces trois entrées de l'écran, pas pour encapsuler une logique.
 */
export function AppearanceSettings() {
    const { isDark, toggleTheme, useSystemTheme, isSystemTheme, useRandomTheme, isRandomTheme } = useTheme();

    return (
        <>
            <SettingItem
                icon="moon-outline"
                title="Theme sombre"
                description="Activer le thème sombre de l'application"
                value={isDark}
                onValueChange={toggleTheme}
                controlType="switch"
            />
            <SettingItem
                icon="phone-portrait-outline"
                title="Theme système"
                description="Utiliser le thème de l'appareil"
                value={isSystemTheme}
                onValueChange={useSystemTheme}
                controlType="switch"
            />
            <SettingItem
                icon="shuffle-outline"
                title="Thème aléatoire"
                description="Changer de thème à chaque démarrage"
                value={isRandomTheme}
                onValueChange={useRandomTheme}
                controlType="switch"
            />
        </>
    );
}
