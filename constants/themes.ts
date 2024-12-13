import { Theme } from '../interfaces/ThemesTypes';

export const lightTheme: Theme = {
	name: 'light',
	bg: {
		base: '#FFFFFF',
		tapBar: '#FFF0DF',
		tabBarActive: '#FFCB8F',
		alarme: '#F8F8F8',
	},
	text: {
		base: '#000000',
		iconFond: '#E6E6E6',
		secondary: '#969696',
		secondary2: '#D8D8D8',
	},
	colors: {
		primary: '#FC9219',
		secondary: '#FFE2C1',
		danger: '#FF574D',
	},
};

export const darkTheme: Theme = {
	name: 'dark',
	bg: {
		base: '#171717',
		tapBar: '#2E1800',
		tabBarActive: '#7C4300',
		alarme: '#2C2C2C',
	},
	text: {
		base: '#FFFFFF',
		iconFond: '#2F2F2F',
		secondary: '#D8D8D8',
		secondary2: '#969696',
	},
	colors: {
		primary: '#975000',
		secondary: '#FFA845',
		danger: '#FF574D'

	},
};

export const autreThemes: Theme[] = [
	{
		name: 'orange',
		bg: {
			base: '#FFF8E1', // Fond clair et chaleureux
			tapBar: '#FFECB3', // Barre avec une teinte dorée douce
			tabBarActive: '#FFC107', // Actif dans une nuance d'or
			alarme: '#FFF3E0' // Fond d'alarme subtil
		},
		text: {
			base: '#3E2723', // Texte sombre et lisible
			iconFond: '#FFCC80', // Fond des icônes orangé
			secondary: '#8D6E63', // Texte secondaire doux
			secondary2: '#BCAAA4' // Texte tertiaire léger
		},
		colors: {
			primary: '#FFA000', // Accent principal orangé
			secondary: '#FF7043', // Accent secondaire corail
			danger: '#D32F2F' // Rouge pour alerte
		}
	},
	{
		name: 'blue',
		bg: {
			base: '#E3F2FD', // Bleu clair paisible
			tapBar: '#BBDEFB', // Barre avec une nuance de ciel
			tabBarActive: '#64B5F6', // Actif bleu plus intense
			alarme: '#E1F5FE' // Fond d'alarme très doux
		},
		text: {
			base: '#0D47A1', // Texte foncé pour contraste
			iconFond: '#90CAF9', // Fond des icônes bleu ciel
			secondary: '#5472D3', // Texte secondaire lavande
			secondary2: '#B3E5FC' // Texte tertiaire plus doux
		},
		colors: {
			primary: '#2196F3', // Accent principal bleu classique
			secondary: '#1E88E5', // Accent secondaire bleu vif
			danger: '#B71C1C' // Rouge pour alerte
		}
	},
	{
		name: 'green',
		bg: {
			base: '#F1F8E9', // Vert pastel clair
			tapBar: '#DCEDC8', // Barre d'un vert plus prononcé
			tabBarActive: '#8BC34A', // Actif dans une nuance fraîche
			alarme: '#F9FBE7' // Fond d'alarme avec du vert pâle
		},
		text: {
			base: '#33691E', // Texte foncé pour lisibilité
			iconFond: '#AED581', // Fond des icônes vert vif
			secondary: '#689F38', // Texte secondaire vert forêt
			secondary2: '#9CCC65' // Texte tertiaire verdoyant
		},
		colors: {
			primary: '#7CB342', // Vert dynamique
			secondary: '#558B2F', // Accent secondaire plus foncé
			danger: '#D32F2F' // Rouge pour alerte
		}
	},
	{
		name: 'purple',
		bg: {
			base: '#F3E5F5', // Violet pastel élégant
			tapBar: '#E1BEE7', // Barre avec des teintes de lilas
			tabBarActive: '#BA68C8', // Actif violet vif
			alarme: '#F8BBD0' // Fond d'alarme rosé
		},
		text: {
			base: '#4A148C', // Texte foncé pour contraste
			iconFond: '#CE93D8', // Fond des icônes lilas
			secondary: '#9C27B0', // Texte secondaire violet royal
			secondary2: '#E1BEE7' // Texte tertiaire plus clair
		},
		colors: {
			primary: '#AB47BC', // Accent principal
			secondary: '#8E24AA', // Accent secondaire profond
			danger: '#C62828' // Rouge pour alerte
		}
	},
	{
		name: 'red',
		bg: {
			base: '#FFEBEE', // Rouge pastel clair
			tapBar: '#FFCDD2', // Barre avec des teintes de rose
			tabBarActive: '#E57373', // Actif rouge vif
			alarme: '#FFEBEE' // Fond d'alarme rosé
		},
		text: {
			base: '#B71C1C', // Texte foncé pour contraste
			iconFond: '#FF8A80', // Fond des icônes rose vif
			secondary: '#D32F2F', // Texte secondaire rouge vif
			secondary2: '#FFCDD2' // Texte tertiaire plus clair
		},
		colors: {
			primary: '#F44336', // Accent principal rouge vif
			secondary: '#E53935', // Accent secondaire rouge foncé
			danger: '#B71C1C' // Rouge pour alerte
		}
	},
	{
		name: 'pink',
		bg: {
			base: '#E8F5E9', // Vert pastel clair
			tapBar: '#C8E6C9', // Barre avec des teintes de vert
			tabBarActive: '#81C784', // Actif vert vif
			alarme: '#E8F5E9' // Fond d'alarme vert pâle
		},
		text: {
			base: '#1B5E20', // Texte foncé pour contraste
			iconFond: '#A5D6A7', // Fond des icônes vert vif
			secondary: '#388E3C', // Texte secondaire vert vif
			secondary2: '#C8E6C9' // Texte tertiaire plus clair
		},
		colors: {
			primary: '#4CAF50', // Accent principal vert vif
			secondary: '#43A047', // Accent secondaire vert foncé
			danger: '#D32F2F' // Rouge pour alerte
		}
	},{
		name: 'brown',
		bg: {
			base: '#212121', // Fond sombre profond
			tapBar: '#424242', // Barre de navigation gris foncé
			tabBarActive: '#616161', // Onglet actif gris moyen
			alarme: '#303030' // Fond d'alarme sombre
		},
		text: {
			base: '#E0E0E0', // Texte clair pour contraste
			iconFond: '#424242', // Fond des icônes gris foncé
			secondary: '#9E9E9E', // Texte secondaire gris
			secondary2: '#757575' // Texte tertiaire gris plus sombre
		},
		colors: {
			primary: '#455A64', // Accent principal bleu-gris
			secondary: '#37474F', // Accent secondaire gris très foncé
			danger: '#B71C1C' // Rouge pour alerte
		}
	},{
		name: 'grey',
		bg: {
			base: '#121212', // Noir profond
			tapBar: '#1E1E1E', // Barre de navigation presque noire
			tabBarActive: '#2C2C2C', // Onglet actif gris très sombre
			alarme: '#1A1A1A' // Fond d'alarme noir profond
		},
		text: {
			base: '#E1E1E1', // Texte blanc cassé
			iconFond: '#2C2C2C', // Fond des icônes gris très sombre
			secondary: '#A0A0A0', // Texte secondaire gris clair
			secondary2: '#6E6E6E' // Texte tertiaire gris moyen
		},
		colors: {
			primary: '#404040', // Accent principal gris foncé
			secondary: '#303030', // Accent secondaire presque noir
			danger: '#B71C1C' // Rouge pour alerte
		}
	},{
		name: 'black_night',
		bg: {
			base: '#0F1222', // Bleu nuit profond
			tapBar: '#1A1E2E', // Barre de navigation bleu nuit moyen
			tabBarActive: '#2A3446', // Onglet actif gris bleuté
			alarme: '#161A2A' // Fond d'alarme bleu nuit sombre
		},
		text: {
			base: '#D1D5E8', // Texte bleu très clair
			iconFond: '#2A3446', // Fond des icônes bleu gris
			secondary: '#8A95B3', // Texte secondaire bleu gris
			secondary2: '#5A6684' // Texte tertiaire bleu gris foncé
		},
		colors: {
			primary: '#3A4666', // Accent principal bleu nuit
			secondary: '#2A3446', // Accent secondaire bleu gris foncé
			danger: '#B71C1C' // Rouge pour alerte
		}
	},
	{
		name: 'blue_night',
		bg: {
			base: '#1C2331', // Bleu nuit profond
			tapBar: '#253041', // Barre de navigation bleu très sombre
			tabBarActive: '#364559', // Onglet actif gris bleu moyen
			alarme: '#17202A' // Fond d'alarme bleu nuit profond
		},
		text: {
			base: '#D6DBDF', // Texte gris très clair
			iconFond: '#364559', // Fond des icônes bleu gris
			secondary: '#7F8C8D', // Texte secondaire gris neutre
			secondary2: '#566573' // Texte tertiaire gris bleu
		},
		colors: {
			primary: '#34495E', // Accent principal bleu gris
			secondary: '#2C3E50', // Accent secondaire bleu gris foncé
			danger: '#B71C1C' // Rouge pour alerte
		}
	},
	{
		name: 'purple_night',
		bg: {
			base: '#1F1B24', // Violet nuit profond
			tapBar: '#2A2531', // Barre de navigation violet très sombre
			tabBarActive: '#3A3241', // Onglet actif gris violet moyen
			alarme: '#1B1721' // Fond d'alarm
		},
		text: {
			base: '#D6DBDF', // Texte gris très clair
			iconFond: '#3A3241', // Fond des icônes violet gris
			secondary: '#7F8C8D', // Texte secondaire gris neutre
			secondary2: '#566573' // Texte tertiaire gris violet
		},
		colors: {
			primary: '#5B3256', // Accent principal violet gris
			secondary: '#45274A', // Accent secondaire violet gris foncé
			danger: '#B71C1C' // Rouge pour alerte
		}
	}
];

