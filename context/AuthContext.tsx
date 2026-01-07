import {UserData} from '@/interfaces/UserData';
import {
	removeUserAllData,
	supabase,
	incrementation_nb_requete,
	getUserData,
	setUserData,
	recupDataUtilisateur,
	saveGroupSupabase,
	saveRappelSupabase, 
    removeUserData,
    setPersonalIcalUrl,
    getPersonalIcalUrl,
    setUsePersonalIcal,
    getUsePersonalIcal
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
	connexionUniversitaire: (icalUrl: string) => Promise<void>;
	deconnexion: () => Promise<void>;
	supabase: any;
	getUserData: () => UserData | null;
	setUserData: (data: UserData) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
	const [user, setUser] = useState<UserData | null>(null);
	const [loading, setLoading] = useState(false);

    const createLocalUser = (icalUrl: string): UserData => ({
        id: 'local_user',
        pseudo: 'Étudiant',
        sub: 'local_sub',
        full_name: 'Étudiant (Local)',
        email: 'etudiant@univ-lehavre.fr',
        avatar_url: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        group: icalUrl,
        api_requests_count: 0,
        rappel: 15,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    });

	const checkUser = useCallback(async () => {
		try {
			const data = await recupDataUtilisateur();
			if (data?.sub) {
				console.log("Connecté via Discord:", data.pseudo);
                
                if (getUsePersonalIcal()) {
                    const savedIcal = getPersonalIcalUrl();
                    if (savedIcal) {
                        data.group = savedIcal;
                    }
                }

				await setUserData(data);
				setUser(data as UserData);
                return;
			}

            const localUser = getUserData();
            if (localUser) {
                if (localUser.id === 'local_user') {
                     const savedIcal = getPersonalIcalUrl();
                     if (savedIcal) {
                         localUser.group = savedIcal;
                         setUserData(localUser);
                     }
                    setUser(localUser);
                    return;
                }
                 setUser(localUser);
                 return;
            }

            const persoIcal = getPersonalIcalUrl();
            if (persoIcal) {
                const newLocalUser = createLocalUser(persoIcal);
                await setUserData(newLocalUser);
                setUser(newLocalUser);
            }

		} catch (error) {
			console.log('Erreur checkUser:', error);
            const localUser = getUserData();
            if (localUser) setUser(localUser);
		}
	}, []);

	useEffect(() => {
		checkUser();
	}, [checkUser]);

    const connexionUniversitaire = async (icalUrl: string) => {
        try {
            setLoading(true);
            setPersonalIcalUrl(icalUrl);
            
            const fakeUser = createLocalUser(icalUrl);
            await setUserData(fakeUser);
            setUser(fakeUser);
        } catch (error) {
            console.error("Erreur connexion universitaire:", error);
        } finally {
            setLoading(false);
        }
    };

	const connexion = async () => {

		try {
			const redirectUrl = 'iuthyperplanningapp://(auth)/(tabs)/home';
			const {data, error} = await supabase.auth.signInWithOAuth({
				provider: 'discord',
				// scopes: '?options=identify+email+connections+guilds',
				options: {redirectTo: redirectUrl},
			});

			if (error) throw error;

			if (data?.url) {
				console.log(data);
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
            connexionUniversitaire,
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
