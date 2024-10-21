import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useState } from 'react';
import { Button, Linking, Platform, StyleSheet, Text, View } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const DiscordLogin: React.FC = () => {
	const [user, setUser] = useState<UserObject | null>(null);
	const [loading, setLoading] = useState(false);

	const checkUser = useCallback(async () => {
		try {
			const { data, error } = await supabase.auth.getUser();
			if (error) throw error;
			if (data?.user) {
				console.log("Utilisateur actuel:", JSON.stringify(data.user.identities?.[0]?.identity_data?.custom_claims.global_name, null, 2));
				setUser(data.user as UserObject);
			}
		} catch (error) {
			console.error('Erreur lors de la récupération de l\'utilisateur:', error);
		}
	}, []);

	useEffect(() => {
		checkUser();
	}, [checkUser]);

	const handleDeepLink = useCallback(async (url: string) => {
		if (url.includes('access_token') && url.includes('refresh_token')) {
			const params = new URLSearchParams(url.split('#')[1]);
			const access_token = params.get('access_token');
			const refresh_token = params.get('refresh_token');

			if (access_token && refresh_token) {
				try {
					const { error: sessionError } = await supabase.auth.setSession({
						access_token,
						refresh_token,
					});
					if (sessionError) throw sessionError;
					await checkUser();
				} catch (error) {
					console.error("Erreur lors de la définition de la session:", error);
				}
			}
		}
	}, [checkUser]);

	useEffect(() => {
		const subscription = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
		return () => subscription.remove();
	}, [handleDeepLink]);

	const handleLogin = async () => {
		setLoading(true);
		try {
			const redirectUrl = Platform.select({
				default: 'iuthyperplanningapp://auth/callback',
			});

			const { data, error } = await supabase.auth.signInWithOAuth({
				provider: 'discord',
				options: { redirectTo: redirectUrl },
			});

			if (error) throw error;

			if (data?.url) {
				const discordUrl = data.url.replace('https://', 'discord://');
				const canOpenDiscord = await Linking.canOpenURL(discordUrl);

				if (canOpenDiscord) {
					console.log("Ouverture de Discord...");
					await Linking.openURL(discordUrl);
				} else {
					console.log("Ouverture de l'URL dans le navigateur...");
					const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
					if (result.type === 'success') {
						await handleDeepLink(result.url);
					}
				}
			}
		} catch (error) {
			console.error("Erreur lors de la connexion:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = async () => {
		try {
			const { error } = await supabase.auth.signOut();
			if (error) throw error;
			setUser(null);
		} catch (error) {
			console.error("Erreur lors de la déconnexion:", error);
		}
	};

	return (
		<View style={styles.container}>
			{user ? (
				<View>
					<Text style={styles.text}>Connecté en tant que : {user.identities[0].identity_data.custom_claims.global_name}</Text>
					<Text style={styles.text}>Email : {user.identities[0].identity_data.email}</Text>
					<Text style={styles.text}>ID : {user.identities[0].id}</Text>
					<Button title="Se déconnecter" onPress={handleLogout} />
				</View>
			) : (
				<Button
					title={loading ? "Chargement..." : "Se connecter avec Discord"}
					onPress={handleLogin}
					disabled={loading}
				/>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		padding: 20,
	},
	text: {
		marginBottom: 10,
	},
});

export default DiscordLogin;

// UserObject interface remains unchanged



export interface UserObject {
	id: string;
	aud: string;
	role: string;
	email: string;
	email_confirmed_at: string;
	phone: string;
	confirmed_at: string;
	last_sign_in_at: string;
	app_metadata: {
		provider: string;
		providers: string[];
	};
	user_metadata: {
		avatar_url: string;
		custom_claims: {
			global_name: string;
		};
		email: string;
		email_verified: boolean;
		full_name: string;
		iss: string;
		name: string;
		phone_verified: boolean;
		picture: string;
		provider_id: string;
		sub: string;
	};
	identities: Array<{
		identity_id: string;
		id: string;
		user_id: string;
		identity_data: {
			avatar_url: string;
			custom_claims: {
				global_name: string;
			};
			email: string;
			email_verified: boolean;
			full_name: string;
			iss: string;
			name: string;
			phone_verified: boolean;
			picture: string;
			provider_id: string;
			sub: string;
		};
		provider: string;
		last_sign_in_at: string;
		created_at: string;
		updated_at: string;
		email: string;
	}>;
	created_at: string;
	updated_at: string;
	is_anonymous: boolean;
}