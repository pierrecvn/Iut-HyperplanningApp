import { Hello } from "@/components/Hello";
import { View } from "react-native";

export default function Index() {
	return (
		<View
			style={{
				flex: 1,
				justifyContent: "center",
				alignItems: "center",
			}}
		>
			{/* <Text>Coucou</Text> */}
			<Hello />
		</View>
	);
}
