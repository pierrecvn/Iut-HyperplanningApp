import {UserData} from '@/interfaces/UserData';
import {createClient} from '@supabase/supabase-js';
import {MMKV} from 'react-native-mmkv';
import 'react-native-url-polyfill/auto';
import {StateStorage} from 'zustand/middleware';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const storage = new MMKV();

export const zustandStorage: StateStorage = {
	getItem: (key: string) => {
		const value = storage.getString(key);
		return value ?? null;
	},
	setItem: (key: string, value: string) => {
		storage.set(key, value);
	},
	removeItem: (key: string) => {
		storage.delete(key);
	},
};

const supabaseStorage = {
	getItem: async (key: string): Promise<string | null> => {
		const value = storage.getString(key);
		return value ?? null;
	},
	setItem: async (key: string, value: string): Promise<void> => {
		storage.set(key, value);
	},
	removeItem: async (key: string): Promise<void> => {
		storage.delete(key);
	},
};

// Configuration de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		storage: supabaseStorage,
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: false,
	},
});

// Fonction pour stocker les données utilisateur dans l'application
export const setUserData = async (userData: UserData): Promise<void> => {
	try {
		storage.set('user_data', JSON.stringify(userData));
	} catch (error) {
		console.error(`Erreur lors du stockage des données utilisateur : ${(error as Error).message}`);
	}
};

// Fonction pour récupérer les données utilisateur stockées dans l'application
export const getUserData = (): UserData | null => {
	try {
		const userData = storage.getString('user_data');
		return userData ? JSON.parse(userData) as UserData : null;
	} catch (error) {
		console.error(`Erreur lors de la récupération des données utilisateur stockées : ${(error as Error).message}`);
		return null;
	}
};

export const removeUserAllData = async (): Promise<void> => {
	try {
		await removeUserData();
		const {error: deleteError} = await supabase.rpc('delete_user_complete');
		if (deleteError) {
			console.error('Erreur lors de la suppression des données :', deleteError);
		}
		await supabase.auth.signOut();
		console.log('Compte utilisateur et données supprimés avec succès');
	} catch (error) {
		console.error(`Erreur lors de la suppression des données utilisateur : ${(error as Error).message}`);
		throw error;
	}
};


export const removeUserData = async (): Promise<void> => {
	try {
		storage.delete('user_data');
	} catch (error) {
		console.error(`Erreur lors de la suppression des données utilisateur : ${(error as Error).message}`);
	}
};

export const incrementation_nb_requete = async (id: string | undefined): Promise<void> => {
	if (!id) return;
	await supabase.rpc('incrementation_nb_requete', {identifiant: id});

	// console.log('Incrémentation du nombre de requêtes');
};

export const recupDataUtilisateur = async (): Promise<UserData | null> => {
	try {
		const {data: {user}, error: authError} = await supabase.auth.getUser();
		await incrementation_nb_requete(user?.id);

		if (authError) throw authError;

		if (!user) {
			throw new Error("Utilisateur non connecté");
		}

		const {data, error: profileError} = await supabase
			.from('utilisateur')
			.select('*')
			.eq('sub', user.user_metadata.sub)
			.single();

		if (profileError) throw profileError;

		data.pseudo = user.user_metadata.custom_claims.global_name;

		return data as UserData;
	} catch (error) {
		console.log(`Erreur lors de la récupération des données utilisateur : ${(error as Error).message}`);
		return null;
	}
};

export const saveGroupSupabase = async (group: string) => {
	try {
		const {data: {user}, error: authError} = await supabase.auth.getUser();

		if (authError) throw authError;

		if (!user) {
			throw new Error("Utilisateur non connecté");
		}

		const {data, error: profileError} = await supabase
			.from('utilisateur')
			.update({group})
			.eq('sub', user.user_metadata.sub);

		if (profileError) throw profileError;

		// console.log(getUserData())

		const userData = await recupDataUtilisateur();
		if (userData) {
			await setUserData(userData);
		}

		// console.log(getUserData())

	} catch (error) {
		console.log(`Erreur lors de la récupération des données utilisateur : ${(error as Error).message}`);
		return null;
	}
}

export const saveRappelSupabase = async (rappel: number) => {
	try {
		const {data: {user}, error: authError} = await supabase.auth.getUser();
		await incrementation_nb_requete(user?.id);

		if (authError) throw authError;

		if (!user) {
			throw new Error("Utilisateur non connecté");
		}

		const {data, error: profileError} = await supabase
			.from('utilisateur')
			.update({rappel})
			.eq('sub', user.user_metadata.sub);

		if (profileError) throw profileError;

		const userData = await recupDataUtilisateur();
		if (userData) {
			await setUserData(userData);
		}

	} catch (error) {
		console.log(`Erreur lors de la récupération des données utilisateur : ${(error as Error).message}`);
		return null;
	}
}

/**
 * Notification stockage
 */
export const saveNotificationStatus = async (status: boolean) => {
	try {
		storage.set('notification_status', JSON.stringify(status));

		const {data: {user}, error: authError} = await supabase.auth.getUser();

		if (authError) throw authError;
		if (!user) throw new Error("Utilisateur non connecté");


	} catch (error) {
		console.error(`Erreur lors de la sauvegarde du statut des notifications : ${(error as Error).message}`);
		return null;
	}
};

export const getNotificationStatus = (): boolean => {
	try {
		const status = storage.getString('notification_status');
		return status ? JSON.parse(status) : true;
	} catch (error) {
		console.error(`Erreur lors de la récupération du statut des notifications : ${(error as Error).message}`);
		return true;
	}
};
