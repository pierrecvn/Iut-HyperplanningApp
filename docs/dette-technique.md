# Dette technique assumée

Points identifiés et volontairement laissés en l'état, avec la raison. Mise à jour le 2026-08-03.

## `@expo/vector-icons` déprécié depuis le SDK 56

**État :** `@expo/vector-icons@15.1.1`, utilisé dans 20 fichiers.

Le SDK 56 déprécie ce paquet au profit de `@react-native-vector-icons/*`, éclaté en un paquet par famille d'icônes — `ionicons`, `material-icons`, `fontawesome`, `ant-design`.

**Pourquoi on ne migre pas :** aucun gain fonctionnel. Le paquet actuel fonctionne et restera supporté plusieurs SDK. En face, la migration demande quatre nouveaux paquets, autant de config plugins dans `app.json`, l'édition manuelle de 20 fichiers, un **rebuild natif** — les polices sont des assets natifs — et une vérification écran par écran de toutes les icônes de l'application.

**Précision utile :** contrairement à ce que laisse entendre le changelog du SDK 56, **il n'existe pas de codemod**. `npx expo-codemod` ne propose que `sdk-56-expo-router-react-navigation-replace`.

**Quand s'en occuper :** quand un SDK annoncera le retrait effectif, ou à l'occasion d'un rebuild natif déjà prévu pour autre chose.

## Dépendance conditionnelle dans un tableau de `useMemo`

`hooks/useEventsAffichage.ts` conserve `estUnique ? null : selectedDate` dans son tableau de dépendances, repris tel quel de l'original.

React attend un tableau de dépendances stable en longueur et en nature. Corriger changerait la mémoïsation, donc le comportement — ça relève d'un commit à part, avec vérification sur appareil.

## `data` fait doublon avec `user` dans `parametres.tsx`

`const data = user; setData(data);` — `data` n'est qu'une photographie de `user` prise au montage. Les deux ne divergent que si `user` change ensuite.

C'est ce doublon qui avait produit le bug de la fréquence de rappel, corrigé au chantier 3 en supprimant la double source côté rappel. Le doublon lui-même subsiste pour le reste des champs.

## `SafeAreaView` déprécié

`components/CasLoginModal.tsx:2` importe `SafeAreaView` depuis `react-native`, alors que les six autres fichiers de l'app utilisent `react-native-safe-area-context`. React Native émet un avertissement à chaque rendu.

Sous edge-to-edge obligatoire, la version de `safe-area-context` gère mieux les encoches. Changement d'une ligne, mais qui touche du rendu.

## `EventDetailModal` non extraite

`components/EventList.tsx` conserve `renderModalContent`, environ 90 lignes de JSX. Le reste du fichier a été découpé (714 → 333 lignes).

Cette modale est liée à `selectedEvent` et au compteur de rafraîchissement à la seconde. L'extraire demande de décider qui possède quoi entre la liste et la modale — ce n'est pas du déplacement mécanique.

## `ThemeContext` persiste un thème que personne n'a choisi

`context/ThemeContext.tsx` enregistre le thème résolu à chaque changement, y compris celui du tout premier rendu — avant que l'effet qui relit le thème sauvegardé ait pu s'appliquer. Ce premier rendu vaut toujours le thème système.

En marche normale c'est invisible : le rendu suivant écrit la bonne valeur par-dessus. Mais si l'application est interrompue entre les deux, une erreur de rendu suffit pour que la valeur système reste persistée et devienne le thème forcé aux démarrages suivants. Constaté le 2026-08-03 pendant la mise au point du clic du widget : le thème est passé de sombre à clair après un plantage de rendu, et y est resté.

Deuxième anomalie au même endroit : `getTheme()` renvoie `'dark'` par défaut quand rien n'est stocké, donc la valeur lue est toujours vraie, donc `setIsSystemTheme(false)` s'exécute à chaque démarrage. L'application ne suit jamais le thème de l'appareil au lancement, malgré l'interrupteur « Theme système » des paramètres.

Corriger demande de trancher qui fait autorité au démarrage entre le thème enregistré et le thème système — ce que le contexte ne décide pas aujourd'hui. Depuis que le widget suit le thème de l'application, l'anomalie se voit aussi sur l'écran d'accueil.

## Couverture de tests partielle

`jest` et `jest-expo` sont configurés, 25 tests existent : `functions/edtDiff`, `functions/lienProfond`, `widgets/contenuCours`. Tous portent sur des fonctions pures.

Rien n'est testé de ce qui touche MMKV — `widgetStore`, `widgetTheme`, `calendarService` — faute de double pour `react-native-mmkv`. `functions/eventFormat.ts` et `functions/groupDisplay.ts` avaient été extraits pour être testables sans rendu et ne le sont toujours pas.

Voir aussi `docs/npm-audit.md` pour les 32 alertes npm, toutes cantonnées à l'outillage.
