import { UserData } from '@/interfaces/UserData';
import { createClient } from '@supabase/supabase-js';
import { createMMKV } from 'react-native-mmkv';
import 'react-native-url-polyfill/auto';
import { StateStorage } from 'zustand/middleware';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const storage = createMMKV();

export const zustandStorage: StateStorage = {
    getItem: (key: string) => {
        const value = storage.getString(key);
        return value ?? null;
    },
    setItem: (key: string, value: string) => {
        storage.set(key, value);
    },
    removeItem: (key: string) => {
        storage.remove(key);
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
        storage.remove(key);
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
        removePersonalIcalUrl();
        const { error: deleteError } = await supabase.rpc('delete_user_complete');
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
        storage.remove('user_data');
    } catch (error) {
        console.error(`Erreur lors de la suppression des données utilisateur : ${(error as Error).message}`);
    }
};

export const incrementation_nb_requete = async (id: string | undefined): Promise<void> => {
    if (!id) return;
    await supabase.rpc('incrementation_nb_requete', { identifiant: id });

    // console.log('Incrémentation du nombre de requêtes');
};

export const recupDataUtilisateur = async (): Promise<UserData | null> => {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        // console.log(user);
        // https://cdn.discordapp.com/banners/549274676849803305/95a0495c28af8aa242a4b836a191e22d.png?size=600
        // 	https://cdn.discordapp.com/banners/549274676849803305/95a0495c28af8aa242a4b836a191e22d.png?size=600
        // 	"https://cdn.discordapp.com/avatars/549274676849803305/1e7d4a02b164da62c7a8aa69046d434f.png
        await incrementation_nb_requete(user?.id);

        if (authError) throw authError;

        if (!user) {
            throw new Error("Utilisateur non connecté");
        }

        const { data, error: profileError } = await supabase
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

export const setPersonalIcalUrl = (url: string) => {
    storage.set('personal_ical_url', url);
};

export const getPersonalIcalUrl = (): string | null => {
    return storage.getString('personal_ical_url') ?? null;
};

export const removePersonalIcalUrl = () => {
    storage.remove('personal_ical_url');
};

// Préférence d'activation de l'iCal perso
export const setUsePersonalIcal = (value: boolean) => {
    storage.set('use_personal_ical', value);
};

export const getUsePersonalIcal = (): boolean => {
    return storage.getBoolean('use_personal_ical') ?? false;
};

export const saveGroupSupabase = async (group: string) => {
    try {
        // Récupérer les données locales actuelles
        const currentLocalData = getUserData();
        
        // Si c'est une URL (iCal perso)
        if (group.startsWith('http')) {
            setPersonalIcalUrl(group);
            setUsePersonalIcal(true); // On active le mode perso

            if (currentLocalData) {
                const updatedData = { ...currentLocalData, group };
                await setUserData(updatedData);
            }
            return;
        } else {
            // Si c'est un groupe standard, on désactive le mode perso
            // MAIS on ne supprime pas l'URL du stockage, pour pouvoir y revenir plus tard
            setUsePersonalIcal(false);
        }

        // Si utilisateur local (mode Université sans Discord)
        if (currentLocalData && currentLocalData.id === 'local_user') {
            const updatedData = { ...currentLocalData, group };
            await setUserData(updatedData);
            return;
        }

        // Sinon (utilisateur Discord + groupe standard court), on sync avec Supabase
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
             if (currentLocalData) {
                 const updatedData = { ...currentLocalData, group };
                 await setUserData(updatedData);
                 return;
             }
            throw new Error("Utilisateur non connecté");
        }

        const { error: profileError } = await supabase
            .from('utilisateur')
            .update({ group })
            .eq('sub', user.user_metadata.sub);

        if (profileError) {
            console.warn("Erreur Supabase, fallback local:", profileError.message);
            if (currentLocalData) {
                 const updatedData = { ...currentLocalData, group };
                 await setUserData(updatedData);
            }
            return;
        }

        // Rechargement propre depuis le serveur pour être synchro
        const userData = await recupDataUtilisateur();
        if (userData) {
            await setUserData(userData);
        }

    } catch (error) {
        console.log(`Erreur lors de la sauvegarde du groupe : ${(error as Error).message}`);
        const currentLocalData = getUserData();
        if (currentLocalData) {
             const updatedData = { ...currentLocalData, group };
             await setUserData(updatedData);
        }
        return null;
    }
}

export const saveRappelSupabase = async (rappel: number) => {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        await incrementation_nb_requete(user?.id);

        if (authError) throw authError;

        if (!user) {
            throw new Error("Utilisateur non connecté");
        }

        const { data, error: profileError } = await supabase
            .from('utilisateur')
            .update({ rappel })
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

        const { data: { user }, error: authError } = await supabase.auth.getUser();

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
/**
 * Theme stockage
 */

export const saveTheme = async (theme_name: string) => {
    try {
        storage.set('theme_name_status', theme_name);

        // console.log("Statut du thème sauvegardé avec succès.");

    } catch (error) {
        console.error(`Erreur lors de la sauvegarde du statut du thème : ${(error as Error).message}`);
        return null;
    }
};

// Récupération du statut du thème
export const getTheme = (): String | null => {
    try {
        const theme_name = storage.getString('theme_name_status');
        return theme_name ? theme_name : 'dark';
    } catch (error) {
        console.error(`Erreur lors de la récupération du statut du thème : ${(error as Error).message}`);
        return null;
    }
};
