import { HyperplanningApi } from '@/functions/hyperplanning';
import * as Updates from 'expo-updates';
import React, { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';
import {useTheme} from "@/context/ThemeContext";

interface UpdateContextType {
	modalVisible: boolean;
	updateStatus: string;
	updateDetails: string;
	checkUpdatesAndApi: () => Promise<void>;
	setModalVisible: (visible: boolean) => void;
}

const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

export function UpdateProvider({ children }: { children: React.ReactNode }) {
	const [modalVisible, setModalVisible] = useState(false);
	const [updateStatus, setUpdateStatus] = useState('');
	const [updateDetails, setUpdateDetails] = useState('');

	const checkUpdatesAndApi = async () => {
		try {
			// console.log('update');
			setModalVisible(true);
			const isDev = process.env.NODE_ENV === 'development';

			if (!isDev) {
				setUpdateStatus('Recherche de mises à jour...');

				const update = await Updates.checkForUpdateAsync();
				if (update.isAvailable) {
					setUpdateStatus('Téléchargement en cours...');
					setUpdateDetails('Une nouvelle mise à jour est disponible. Veuillez patienter.');
					setTimeout(() => setModalVisible(true), 500);
					await Updates.fetchUpdateAsync();
					setUpdateStatus('Rechargement de l\'application...');
					await Updates.reloadAsync();
				} else {
					setUpdateStatus('Aucune nouvelle mise à jour disponible.');
					setUpdateDetails('Tout est à jour !');
					setModalVisible(false);
				}
			} else {
				console.log('Mode développement actif.');
				setUpdateStatus('Mode développement actif.');
				setModalVisible(false);
			}
			setModalVisible(false);
		} catch (error: any) {
			console.error(error);
			setUpdateStatus('Erreur détectée.');
			setUpdateDetails(error.message || 'Une erreur est survenue (Réseau), veuillez réessayer plus tard.');
			setTimeout(() => setModalVisible(false), 4000);
		}
	};

	return (
		<UpdateContext.Provider
			value={{
				modalVisible,
				updateStatus,
				updateDetails,
				checkUpdatesAndApi,
				setModalVisible,
			}}
		>
			{children}
		</UpdateContext.Provider>
	);
}

export const useUpdate = () => {
	const context = useContext(UpdateContext);
	if (!context) {
		throw new Error("useUpdate ne peut être utilisé qu'à l'intérieur de UpdateProvider.");
	}
	return context;
};
