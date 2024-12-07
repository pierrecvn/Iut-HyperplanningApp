import React, { createContext, ReactNode, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme } from '../constants/themes';
import { Theme, ThemeContextType, ThemeMode } from '../interfaces/ThemesTypes';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
	children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
	const systemColorScheme = useColorScheme();
	const [isSystemTheme, setIsSystemTheme] = useState<boolean>(true);
	const [forcedTheme, setForcedTheme] = useState<ThemeMode | null>(null);

	// console.log(systemColorScheme + " -> theme system " + isSystemTheme);
	// console.log(forcedTheme + " -> theme forcé " + isSystemTheme);

	// console.log("ThemeProvider");

	const theme: Theme = isSystemTheme
		? systemColorScheme === 'dark' ? darkTheme : lightTheme
		: forcedTheme === 'dark' ? darkTheme : lightTheme;

	const toggleTheme = (): void => {
		setIsSystemTheme(false);
		setForcedTheme(forcedTheme === 'dark' ? 'light' : 'dark');
	};

	const useSystemTheme = (): void => {
		setIsSystemTheme(true);
		setForcedTheme(null);
	};

	return (
		<ThemeContext.Provider value={{
			theme,
			isDark: theme === darkTheme,
			toggleTheme,
			useSystemTheme,
			isSystemTheme
		}}>
			{children}
		</ThemeContext.Provider>
	);
};

export const useTheme = (): ThemeContextType => {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error('useTheme ne peut être utilisé qu\'à l\'intérieur de ThemeProvider');
	}
	return context;
};

