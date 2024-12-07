import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useUpdate } from './UpdateContext';


export const UserInactivityProvider = ({ children }: any) => {
	const appState = useRef(AppState.currentState);
	const { checkUpdatesAndApi } = useUpdate();

	useEffect(() => {
		const subscription = AppState.addEventListener('change', handleAppStateChange);

		return () => {
			subscription.remove();
		};
	}, []);

	const handleAppStateChange = async (nextAppState: AppStateStatus) => {
		// console.log('Nonnnn pourquoi tu pars ;^;')
		if (nextAppState === 'active' && appState.current.match(/background/)) {
			// afficher le modal pour la verif api
			// console.log('De retour !');
			checkUpdatesAndApi();
		}
		appState.current = nextAppState;
	};
	return children;
};
