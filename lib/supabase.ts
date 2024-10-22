import { createClient } from '@supabase/supabase-js';
import { MMKV } from 'react-native-mmkv';
import 'react-native-url-polyfill/auto';
import { StateStorage } from 'zustand/middleware';

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


//exemple 
/*
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AppState {
  counter: number;
  increment: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
	(set) => ({
	  counter: 0,
	  increment: () => set((state) => ({ counter: state.counter + 1 })),
	}),
	{
	  name: 'app-storage',
	  storage: zustandStorage,
	}
  )
);
*/