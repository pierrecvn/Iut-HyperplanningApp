import * as Updates from 'expo-updates';
import { useEffect } from "react";
import { Alert, Text, View } from "react-native";


export default function Index() {

	async function onFetchUpdateAsync() {
		try {
			const update = await Updates.checkForUpdateAsync();

			if (update.isAvailable) {
				await Updates.fetchUpdateAsync();
				await Updates.reloadAsync();
			}
		} catch (error) {
			Alert.alert(`Error ${error}}`);
		}

	}

	useEffect(() => {
		onFetchUpdateAsync();
	}, []);

	return (
		<View
			style={{
				flex: 1,
				justifyContent: "center",
				alignItems: "center",
			}}
		>
			<Text>
				// affiche la version de l'application
				(Coucou mis a jour pour la version 1.0.1)
			</Text>
			{/* <Hello /> */}
		</View>
	);
}

