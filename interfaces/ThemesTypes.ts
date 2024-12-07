export interface ThemeBg {
	// bg
	base?: string;
	tapBar?: string;
	tabBarActive?: string;
	alarme?: string;
}

export interface ThemeText {
	// text
	base?: string;
	iconFond?: string;
	secondary?: string;
	secondary2?: string;
}

export interface ThemeColors {
	// colors
	primary?: string;
	secondary?: string;
	danger?: string;
}

export interface Theme {
	bg: ThemeBg;
	text: ThemeText;
	colors: ThemeColors;
}

export type ThemeMode = 'light' | 'dark';

export interface ThemeContextType {
	theme: Theme;
	isDark: boolean;
	toggleTheme: () => void;
	useSystemTheme: () => void;
	isSystemTheme: boolean;
}
