import React, {createContext, ReactNode, useContext, useEffect, useState} from 'react';
import {useColorScheme} from 'react-native';
import {autreThemes, darkTheme, lightTheme} from '../constants/themes';
import {Theme, ThemeContextType, ThemeMode} from '../interfaces/ThemesTypes';
import {getTheme, saveTheme} from "@/functions/supabase";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
	children: ReactNode;
}

const getThemeByName = (name: string): Theme => {
	switch (name) {
		case 'light':
			return lightTheme;
		case 'dark':
			return darkTheme;
		default:
			return autreThemes.find(theme => theme.name === name) || lightTheme;
	}
};

export const ThemeProvider = ({children}: ThemeProviderProps) => {
	const systemColorScheme = useColorScheme();
	const [isSystemTheme, setIsSystemTheme] = useState<boolean>(true);
	const [forcedThemeName, setForcedThemeName] = useState<ThemeMode | null>(null);
	const [isRandomTheme, setIsRandomTheme] = useState<boolean>(false);
	const [randomThemeName, setRandomThemeName] = useState<string | null>(null);

	const theme: Theme = isSystemTheme
		? systemColorScheme === 'dark'
			? darkTheme
			: lightTheme
		: isRandomTheme
			? getThemeByName(randomThemeName || autreThemes[0].name)
			: getThemeByName(forcedThemeName || 'light');

	useEffect(() => {
		const savedThemeName = getTheme();
		console.log(`Thème sauvegardé : ${savedThemeName}`);
		if (savedThemeName) {
			setIsSystemTheme(false);
			setIsRandomTheme(false);
			setForcedThemeName(savedThemeName as ThemeMode);
		}
	}, []);

	useEffect(() => {
		saveTheme(theme.name).catch(error =>
			console.error(`Erreur lors de la sauvegarde du thème : ${error}`)
		);
	}, [theme]);

	const toggleTheme = (): void => {
		if (isRandomTheme)
			setIsRandomTheme(false);

		if (isSystemTheme) {
			setIsSystemTheme(false);
			setForcedThemeName(theme.name === 'dark' ? 'light' : 'dark');
		} else {
			if (isRandomTheme) {
				setIsRandomTheme(false);
			}
			if (forcedThemeName) {
				setForcedThemeName(
					forcedThemeName === 'dark' ? 'light' : 'dark'
				);
			}
		}
	};

	const useSystemTheme = (): void => {
		if (isRandomTheme)
			setIsRandomTheme(false);
		if (isSystemTheme) {
			setIsSystemTheme(false);
			setForcedThemeName('dark');
		} else {
			setIsSystemTheme(true);
			setForcedThemeName(null);
		}
	};

	// Active un thème aléatoire
	const useRandomTheme = (): void => {
		if (isSystemTheme) {
			setIsSystemTheme(false);
		}
		if (isSystemTheme) {
			setIsSystemTheme(false);
		}
		setIsRandomTheme(true);
		setRandomThemeName(autreThemes[Math.floor(Math.random() * autreThemes.length)].name);
	};

	return (
		<ThemeContext.Provider
			value={{
				theme,
				isDark: theme.name === 'dark',
				toggleTheme,
				useSystemTheme,
				isSystemTheme,
				useRandomTheme,
				isRandomTheme,
			}}
		>
			{children}
		</ThemeContext.Provider>
	);
};

export const useTheme = (): ThemeContextType => {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error('useTheme doit être utilisé dans ThemeProvider.');
	}
	return context;
};
