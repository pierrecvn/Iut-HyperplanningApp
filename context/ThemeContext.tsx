import React, {createContext, ReactNode, useContext, useEffect, useState} from 'react';
import {useColorScheme} from 'react-native';
import {autreThemes, darkTheme, lightTheme} from '../constants/themes';
import {Theme, ThemeContextType, ThemeMode} from '../interfaces/ThemesTypes';
import {getTheme, saveTheme} from "@/functions/supabase";
import {enregistrerThemeWidget} from "@/functions/widgetTheme";
import {demanderMiseAJourWidget} from "@/functions/widgetRefresh";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
	children: ReactNode;
}

/**
 * Ce qu'on enregistre est le CHOIX de l'utilisateur, pas le thème qui en
 * résulte : « suivre l'appareil » et « thème clair » donnent le même rendu un
 * jour de thème système clair, mais ne veulent pas dire la même chose au
 * démarrage suivant. En n'enregistrant que le résultat, l'application perdait
 * le mode à chaque relance et figeait l'utilisateur sur une valeur qu'il
 * n'avait pas demandée.
 *
 * Ces deux constantes ne sont pas des noms de thème valides, aucune confusion
 * possible avec 'light', 'dark' ou un thème fantaisie. Une valeur déjà
 * enregistrée par une version précédente est un nom de thème, donc relue comme
 * un thème forcé : rien ne change pour l'existant.
 */
const CHOIX_SYSTEME = 'systeme';
const CHOIX_ALEATOIRE = 'aleatoire';

const themeAleatoire = (): string =>
	autreThemes[Math.floor(Math.random() * autreThemes.length)].name;

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
	/** Tant que le choix enregistré n'est pas lu, on n'enregistre rien. */
	const [choixCharge, setChoixCharge] = useState<boolean>(false);

	const theme: Theme = isSystemTheme
		? systemColorScheme === 'dark'
			? darkTheme
			: lightTheme
		: isRandomTheme
			? getThemeByName(randomThemeName || autreThemes[0].name)
			: getThemeByName(forcedThemeName || 'light');

	useEffect(() => {
		const choix = getTheme();
		console.log(`Choix de thème enregistré : ${choix ?? 'aucun'}`);

		if (choix === CHOIX_ALEATOIRE) {
			// Le tirage a lieu ici, pas à l'enregistrement : c'est ce que
			// promet le réglage « changer de thème à chaque démarrage ».
			setIsSystemTheme(false);
			setIsRandomTheme(true);
			setRandomThemeName(themeAleatoire());
		} else if (choix && choix !== CHOIX_SYSTEME) {
			setIsSystemTheme(false);
			setIsRandomTheme(false);
			setForcedThemeName(choix as ThemeMode);
		}
		// Rien d'enregistré, ou « systeme » : on laisse l'état initial, qui
		// suit déjà l'appareil.

		setChoixCharge(true);
	}, []);

	useEffect(() => {
		// Rien n'est enregistré tant que le choix existant n'a pas été lu. Le
		// tout premier rendu vaut le thème de l'appareil, faute d'avoir encore
		// lu quoi que ce soit ; l'enregistrer écrasait le choix de
		// l'utilisateur. Le rendu suivant réparait la valeur en temps normal,
		// mais une interruption entre les deux — une erreur de rendu suffit —
		// la laissait fausse, et elle devenait le thème forcé aux démarrages
		// suivants.
		if (!choixCharge) return;

		const choix = isSystemTheme
			? CHOIX_SYSTEME
			: isRandomTheme
				? CHOIX_ALEATOIRE
				: theme.name;

		saveTheme(choix).catch(error =>
			console.error(`Erreur lors de la sauvegarde du thème : ${error}`)
		);

		// Le widget d'écran d'accueil ne peut lire ni ce contexte ni le thème
		// système : il relit cette valeur au stockage à chaque rendu. La
		// demande de mise à jour évite d'attendre le prochain rafraîchissement
		// périodique — jusqu'à 30 minutes — pour qu'il change de palette.
		enregistrerThemeWidget(theme.name === 'dark');
		demanderMiseAJourWidget();
	}, [theme, isSystemTheme, isRandomTheme, choixCharge]);

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
		setIsSystemTheme(false);
		setIsRandomTheme(true);
		setRandomThemeName(themeAleatoire());
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
