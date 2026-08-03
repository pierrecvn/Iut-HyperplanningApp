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

## Absence de tests

`jest` et `jest-expo` sont configurés, aucun test n'existe.

`functions/eventFormat.ts` (4 fonctions pures) et `functions/groupDisplay.ts` ont été extraits pendant le chantier 3 précisément pour être testables sans rendu. C'est le point d'entrée naturel si on veut commencer une suite de tests.

Voir aussi `docs/npm-audit.md` pour les 32 alertes npm, toutes cantonnées à l'outillage.
