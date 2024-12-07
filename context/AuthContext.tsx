import {UserData} from '@/interfaces/UserData';
import {
	removeUserAllData,
	supabase,
	incrementation_nb_requete,
	getUserData,
	setUserData,
	recupDataUtilisateur,
	saveGroupSupabase,
	saveRappelSupabase, removeUserData
} from '@/functions/supabase';
import {router} from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';

interface AuthContextProps {
	user: UserData | null;
	loading: boolean;
	saveGroupSupabase: (group: string) => Promise<any>;
	saveRappelSupabase: (rappel: number) => Promise<any>;
	incrementation_nb_requete: (id: string) => Promise<void>;
	recupDataUtilisateur: () => Promise<UserData | null>;
	removeUserAllData: () => void;
	checkUser: () => Promise<void>;
	connexion: () => Promise<void>;
	deconnexion: () => Promise<void>;
	supabase: any;
	getUserData: () => UserData | null;
	setUserData: (data: UserData) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
	const [user, setUser] = useState<UserData | null>(null);
	const [loading, setLoading] = useState(false);

	// console.log('AuthProvider');

	const checkUser = useCallback(async () => {
		try {
			const data = await recupDataUtilisateur();
			if (data?.sub) {
				await setUserData(data);
				setUser(data as UserData);
			}
		} catch (error) {
			console.log('Erreur lors de la récupération de l\'utilisateurv Discord:', error);
		}
	}, []);

	// useEffect(() => {
	// 	checkUser();
	// }, [checkUser]);

	const connexion = async () => {

		try {
			const redirectUrl = 'iuthyperplanningapp://(auth)/(tabs)/home';
			const {data, error} = await supabase.auth.signInWithOAuth({
				provider: 'discord',
				options: {redirectTo: redirectUrl},
			});

			if (error) throw error;

			if (data?.url) {
				const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

				if (result.type === 'success') {
					if (result.url.includes("error=access_denied")) {
						router.replace('/');
						setLoading(false);
						return;
					}

					const url = result.url;
					const params = new URLSearchParams(url.split('#')[1]);
					const access_token = params.get('access_token');
					const refresh_token = params.get('refresh_token');

					if (access_token && refresh_token) {
						await supabase.auth.setSession({access_token, refresh_token});
						await checkUser();
						setLoading(true);
					}
				}
			}
		} catch (error) {
			console.error("Erreur lors de la connexion:", error);
		} finally {
			setLoading(false);
		}
	};

	const deconnexion = async () => {
		try {
			const {error} = await supabase.auth.signOut();
			await removeUserData();
			if (error) throw error;
			setUser(null);
			router.replace('/');
		} catch (error) {
			console.error("Erreur lors de la déconnexion:", error);
		}
	};


	return (
		<AuthContext.Provider value={{
			user,
			loading,
			checkUser,
			connexion,
			deconnexion,
			removeUserAllData,
			recupDataUtilisateur,
			saveGroupSupabase,
			saveRappelSupabase,
			incrementation_nb_requete,
			setUserData,
			getUserData,
			supabase,
		}}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth doit être utilisé dans un AuthProvider");
	}
	return context;
};
