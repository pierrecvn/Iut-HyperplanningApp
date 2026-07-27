# Chantier 2 — Montée Expo SDK 54 → 57

**Date :** 2026-07-27
**Statut :** en attente de relecture
**Branche cible :** `chore/upgrade-sdk-57`
**Prérequis :** chantier 1 fusionné (`docs/superpowers/specs/2026-07-27-hygiene-purge-deps-design.md`)

## Contexte

Le chantier 1 a ramené le projet de 61 à 41 dépendances directes et a déclaré les trois modules fantômes qui auraient disparu pendant cette montée. Il a aussi laissé derrière lui un harnais de vérification — `tsc`, `expo export`, `expo-doctor` — dont la référence est connue et documentée.

Ce chantier consomme ce harnais.

## Reconnaissance

Une correction d'analyse doit être consignée, parce qu'elle a orienté la décision initiale dans la mauvaise direction.

L'évaluation de départ annonçait comme ruptures majeures « Gesture Handler 3, async-storage 3, ui-datepicker 3 ». Ces numéros venaient de la colonne *Latest* de `npm outdated`, c'est-à-dire la dernière version publiée sur npm. Or `expo install --fix` installe la version **alignée sur le SDK**, jamais la dernière de npm : le SDK 57 embarque Gesture Handler **2.32**. Ces majeures ne sont pas au programme.

En sens inverse, deux ruptures réelles avaient été manquées — le découplage `react-navigation` du SDK 56 et la dépréciation d'`expo-navigation-bar` du SDK 55.

### État natif constaté

Un `expo prebuild --platform android --no-install` (répertoire `android/` ignoré par Git, supprimé après lecture) donne :

```
newArchEnabled=true
hermesEnabled=true
edgeToEdgeEnabled=true
# WARNING: expo.edgeToEdgeEnabled est déprécié et sera retiré en SDK 55
```

**Les deux ruptures phares du SDK 55 sont donc déjà satisfaites.** L'app tourne en New Architecture et en edge-to-edge depuis le SDK 54. Le palier 55, redouté au départ, devient l'un des plus légers.

### Répartition réelle de la difficulté

| SDK | React Native | Ce qui touche ce projet |
|---|---|---|
| 55 | 0.83 | Méthodes d'`expo-navigation-bar` dépréciées sous edge-to-edge ; `eas update` exige `--environment` |
| 56 | 0.85 | **`expo-router` ne dépend plus de `react-navigation`** ; `expo/fetch` devient le `fetch` global |
| 57 | 0.86 | Aucune rupture — Expo le présente comme sa montée la plus simple |

Le centre de gravité du chantier est le palier 56.

## Décisions

### Montée par paliers, un seul build EAS

`54 → 55 → 56 → 57`, un commit par palier, chacun franchissant la barrière automatique `tsc` + `expo export` + `expo-doctor` avant de passer au suivant. Un unique build EAS `preview` à la fin, pour la validation sur appareil.

L'alternative — un build par palier — coûterait trois builds et trois sessions de test manuel sans rien apporter ici : le harnais détecte les ruptures de résolution et de typage, et l'app n'a pas d'interaction native complexe qui échapperait à ces contrôles.

Le saut direct `54 → 57` a été écarté parce qu'il ferait arriver ensemble la dépréciation edge-to-edge et le découplage `react-navigation`, deux migrations sans rapport dont le diagnostic se mélangerait.

### `expo/fetch` : opt-out d'abord, migration plus tard

Le SDK 56 installe `expo/fetch` comme `globalThis.fetch` par défaut, ce qui change l'implémentation réseau sous `@supabase/supabase-js` et sous la récupération des flux `.ics`.

Le palier 56 pose `EXPO_PUBLIC_USE_RN_FETCH=1` pour conserver l'implémentation actuelle. L'adoption d'`expo/fetch` devient un changement séparé, postérieur à la montée.

C'est le même raisonnement qu'au chantier 1 pour `react-native-linear-gradient` : ne pas mêler une réécriture à comportement observable à une montée de version, sous peine de ne plus savoir ce qui a cassé quoi.

### `react-native-linear-gradient` → `expo-linear-gradient`

Reporté depuis le chantier 1, traité ici en commit final : un rebuild natif a lieu de toute façon. `app/login.tsx:5` est le seul point d'usage. Le changement porte sur l'import et le passage de l'export par défaut à un export nommé.

### Hors périmètre

- **`@expo/vector-icons` → `@react-native-vector-icons/*`** — le SDK 56 déprécie sans retirer, et un codemod est fourni. Douze fichiers sont concernés : c'est un chantier à part entière, pas un dommage collatéral de montée de version.
- **Adoption d'`expo/fetch`** — voir ci-dessus.
- **Cible iOS** — le SDK 56 relève le minimum à iOS 16.4 et Xcode 26.4. Sans objet tant que la distribution se fait en APK Android, mais à retenir si une cible iOS revient.

## Conséquence connue et acceptée

Depuis React Native 0.85 (SDK 56), un changement dans Hermes fait qu'importer `react-native-reanimated` augmente l'empreinte mémoire de 25 à 30 %, même sans utiliser la bibliothèque. Reanimated est une dépendance transitive d'`expo-router` : elle n'est pas retirable.

Ce n'est pas un défaut introduit par ce chantier, mais il faut s'attendre à une hausse de la consommation mémoire après le palier 56 et ne pas la diagnostiquer comme une fuite.

## Plan par paliers

Chaque palier suit la même séquence : `npx expo install expo@<version>` puis `npx expo install --fix`, corrections spécifiques, barrière automatique, commit.

**Palier 55** — retirer les deux appels `NavigationBar.setPositionAsync('absolute')` et `setBackgroundColorAsync('transparent')` d'`app/_layout.tsx:92-99`, redondants sous edge-to-edge déjà actif. Mettre à jour la commande `eas update` du `README.md` et de `commandes.md` avec `--environment`.

**Palier 56** — le palier lourd. Poser `EXPO_PUBLIC_USE_RN_FETCH=1`. Appliquer le codemod de découplage `react-navigation` sur les cinq écrans qui importent `@react-navigation/bottom-tabs` et `@react-navigation/elements`, dont `useBottomTabBarHeight` dans `home.tsx`, `planning.tsx` et `salle.tsx`. Selon ce que fait le codemod, les deux dépendances déclarées au chantier 1 deviendront peut-être inutiles — à réévaluer, pas à supposer.

**Palier 57** — `expo install --fix` et vérification. Aucune correction attendue.

**Finalisation** — migration `linear-gradient`, puis build EAS `preview` en APK et validation sur appareil.

## Vérification

Référence de départ, héritée du chantier 1 :

| Contrôle | Valeur |
|---|---|
| `tsc --noEmit` | 0 erreur |
| `expo export --platform android` | 1849 modules, 5,38 Mo |
| `expo-doctor` | 1 échec connu : pair `react-native-web` manquant, réclamé par `react-native-ui-datepicker` |
| Dépendances directes | 41 |

Le nombre de modules et la taille du bundle **vont bouger** à chaque palier — c'est attendu, React Native change de version. Ce sont des indicateurs, pas des critères.

Les vrais critères, à chaque palier :

- `tsc --noEmit` reste à 0 erreur ;
- `expo export --platform android` aboutit ;
- `expo-doctor` ne fait apparaître aucun échec autre que celui déjà connu.

Et en fin de chantier uniquement, sur appareil via un build EAS `preview` : les cinq écrans, avec une attention particulière à la barre d'onglets et aux marges de sécurité, puisque c'est ce que le découplage `react-navigation` et l'edge-to-edge affectent en premier.

## Risques

| Risque | Probabilité | Parade |
|---|---|---|
| Le codemod `react-navigation` du SDK 56 ne couvre pas `useBottomTabBarHeight` | moyenne | palier isolé dans son commit ; l'API de remplacement est cherchée dans le changelog `expo-router` avant d'improviser |
| `react-native-ui-datepicker` 2.0.12 incompatible avec RN 0.86 | moyenne | c'est la dépendance la moins alignée sur Expo ; en cas d'échec, évaluer sa v3 comme changement séparé |
| Régression visuelle de la barre d'onglets ou des marges | moyenne | seule la validation sur appareil la détecte — d'où le build EAS obligatoire en fin de chantier |
| `react-native-linear-gradient` incompatible avec RN 0.86 | faible | la migration vers `expo-linear-gradient` est déjà au programme et résout le cas |

Un commit par palier rend le retour arrière granulaire : `git revert` d'un seul palier laisse les précédents en place.

## Suite

Chantier 3 — découpage de `parametres.tsx` (1007 lignes) et `EventList.tsx` (659 lignes).
