import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from '@/widgets/widgetTaskHandler';

// Point d'entrée de l'application.
//
// react-native-android-widget impose ce fichier : le gestionnaire du widget
// doit être enregistré au démarrage du bundle JS, y compris quand Android
// démarre ce bundle sans ouvrir l'application. L'entrée d'expo-router est donc
// importée ici plutôt que déclarée directement dans package.json.
import 'expo-router/entry';

registerWidgetTaskHandler(widgetTaskHandler);
