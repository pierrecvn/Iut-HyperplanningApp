import { HyperplanningApi } from '@/functions/hyperplanning';
import * as Updates from 'expo-updates';
import React, { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';

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
	// console.log('UpdateProvider');

	const checkUpdatesAndApi = async () => {
		try {
			// console.log('checkUpdatesAndApi');
			// setModalVisible(true);
			// const dev = process.env.NODE_ENV === 'development';
			//
			// if (!dev) {
			// 	setUpdateStatus('Recherche de mises à jour...');
			// 	const update = await Updates.checkForUpdateAsync();
			//
			// 	if (update.isAvailable) {
			// 		setUpdateStatus('Télechargement ...');
			// 		setUpdateDetails('Une nouvelle mise à jour est disponible. \nVeillez patienter');
			// 		await Updates.fetchUpdateAsync();
			// 		setUpdateStatus('Rechargement...');
			// 		await Updates.reloadAsync();
			// 	} else {
			// 		setUpdateStatus('Pas de nouvelles mise à jour');
			// 		setUpdateDetails('Tout est parfait !');
			// 		setTimeout(() => setModalVisible(false), 500);
			// 	}
			// } else {
			// 	setUpdateStatus('Mode dev');
			// 	setTimeout(() => setModalVisible(false), 200);
			// }
			//
			// // Vérification de l'API
			// try {
			// 	setModalVisible(true);
			// 	setUpdateStatus(`Vérification de l'api...`);
			// 	setUpdateDetails('Veillez patienter');
			// 	await HyperplanningApi.enVie();
			// 	setTimeout(() => setModalVisible(false), 200);
			// } catch (error: any) {
			// 	setUpdateStatus(`Erreur avec l'api`);
			// 	setUpdateDetails(error.message + " réessayer plus tard");
			// }

		} catch (error: any) {
			setModalVisible(false);
			Alert.alert(`Error`, error.message);
		}
	};

	return (
		<UpdateContext.Provider value={{
			modalVisible,
			updateStatus,
			updateDetails,
			checkUpdatesAndApi,
			setModalVisible
		}}>
			{children}
		</UpdateContext.Provider>
	);
};

export const useUpdate = () => {
	const context = useContext(UpdateContext);
	if (!context) {
		throw new Error('useUpdate ne peut être utilisé qu\'à l\'intérieur de UpdateProvider');
	}
	return context;
};