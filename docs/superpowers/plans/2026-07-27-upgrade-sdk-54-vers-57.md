# Montée Expo SDK 54 → 57 : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Monter le projet d'Expo SDK 54 à 57 (React Native 0.81 → 0.86) par paliers successifs, chacun validé automatiquement, avec une seule validation sur appareil en fin de chantier.

**Architecture:** Trois paliers `54→55→56→57`, un commit par palier. Entre chaque, la barrière automatique héritée du chantier 1 : `tsc --noEmit` à 0 erreur, `expo export --platform android` qui aboutit, `expo-doctor` sans échec nouveau. Le nombre de modules et la taille du bundle sont relevés à titre indicatif mais ne sont pas des critères — React Native change de version à chaque palier.

**Tech Stack:** Expo SDK 55/56/57, React Native 0.83/0.85/0.86, React 19.2, TypeScript 5.4, npm 11.6.2, Node v25.0.0, EAS.

**Spec :** `docs/superpowers/specs/2026-07-27-upgrade-sdk-54-vers-57-design.md`

**Référence de départ (chantier 1) :** `tsc` 0 erreur · bundle 1849 modules / 5,38 Mo · 41 dépendances directes · `expo-doctor` 1 échec connu (pair `react-native-web` réclamé par `react-native-ui-datepicker`).

---

## Fichiers touchés

| Fichier | Palier | Nature du changement |
|---|---|---|
| `package.json` / `package-lock.json` | tous | versions alignées par `expo install --fix` |
| `app/_layout.tsx:92-99` | 55 | retrait des appels `NavigationBar` redondants |
| `README.md`, `commandes.md` | 55 | `eas update` prend `--environment` |
| `app/(auth)/(tabs)/home.tsx` | 56 | imports `@react-navigation/*` → `expo-router/*` |
| `app/(auth)/(tabs)/planning.tsx` | 56 | idem |
| `app/(auth)/(tabs)/salle.tsx` | 56 | idem |
| `app/(auth)/(tabs)/parametres.tsx` | 56 | idem |
| `app/(auth)/notifications.tsx` | 56 | idem |
| `.env` ou `eas.json` | 56 | `EXPO_PUBLIC_USE_RN_FETCH=1` |
| `app/login.tsx:5` | final | `linear-gradient` → `expo-linear-gradient` |

---

## Task 1 : Branche et confirmation de la référence

- [ ] **Step 1 : Créer la branche**

```powershell
git checkout main
git pull --ff-only 2>$null
git checkout -b chore/upgrade-sdk-57
```

- [ ] **Step 2 : Confirmer que la référence tient toujours**

```powershell
npx tsc --noEmit
Write-Output "exit tsc = $LASTEXITCODE (0 attendu)"
```

Attendu : exit 0, aucune erreur. Si ce n'est pas le cas, arrêter — la référence du chantier 1 n'est plus valide et il faut comprendre pourquoi avant de monter quoi que ce soit.

---

## Task 2 : Palier 55 (React Native 0.83)

**Files:**
- Modifier : `package.json`, `app/_layout.tsx:92-99`, `README.md`, `commandes.md`

Rappel de la reconnaissance : `newArchEnabled=true` et `edgeToEdgeEnabled=true` sont déjà en place. Les deux ruptures phares de ce SDK sont donc sans objet ici.

- [ ] **Step 1 : Monter le paquet expo**

```powershell
npx expo install expo@^55.0.0
```

- [ ] **Step 2 : Aligner toutes les dépendances sur le SDK 55**

```powershell
npx expo install --fix
```

- [ ] **Step 3 : Relever ce qui a bougé**

```powershell
git diff package.json
```

Lire attentivement : c'est la liste exacte des versions qu'Expo juge alignées. Elle diffère volontairement des dernières versions npm.

- [ ] **Step 4 : Retirer les appels NavigationBar devenus redondants**

Dans `app/_layout.tsx`, l'effet des lignes 92-99 est :

```typescript
    useEffect(() => {
        const setNavBarColor = async () => {
            await NavigationBar.setPositionAsync('absolute');
            await NavigationBar.setBackgroundColorAsync('transparent');
        };
        setNavBarColor();
        if (error) throw error;
    }, [error]);
```

Ces deux méthodes sont dépréciées sous edge-to-edge, qui est déjà actif et produit ce comportement nativement. Remplacer l'effet entier par :

```typescript
    useEffect(() => {
        if (error) throw error;
    }, [error]);
```

Puis retirer l'import devenu inutile en `app/_layout.tsx:10` :

```typescript
import * as NavigationBar from 'expo-navigation-bar';
```

Attention : le `if (error) throw error;` doit être conservé. Il n'a aucun rapport avec la barre de navigation — il propage l'erreur de chargement des polices — mais il était logé dans le même effet.

- [ ] **Step 5 : Vérifier qu'expo-navigation-bar n'est plus utilisé nulle part**

```powershell
Get-ChildItem -Recurse -Include *.ts,*.tsx | Where-Object { $_.FullName -notmatch 'node_modules|dist' } | Select-String -Pattern "NavigationBar|expo-navigation-bar"
```

Si la sortie est vide, retirer aussi le paquet et son plugin :

```powershell
npm uninstall expo-navigation-bar
```

et supprimer la ligne `"expo-navigation-bar",` du tableau `plugins` d'`app.json`.

- [ ] **Step 6 : Mettre à jour les commandes eas update**

Le SDK 55 rend `--environment` obligatoire. Dans `README.md`, remplacer :

```
update : npx eas update --branch production
```

par :

```
update : npx eas update --branch production --environment production
```

Dans `commandes.md`, remplacer :

```
eas update --branch main --message "update de test sur l'app"
```

par :

```
eas update --branch main --environment production --message "update de test sur l'app"
```

- [ ] **Step 7 : Barrière automatique**

```powershell
npx tsc --noEmit
Write-Output "exit tsc = $LASTEXITCODE"
npx expo export --platform android --output-dir dist --clear
Write-Output "exit export = $LASTEXITCODE"
npx expo-doctor
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
```

Attendu : `tsc` exit 0 ; `export` exit 0 ; `expo-doctor` sans échec autre que le pair `react-native-web` déjà connu. Le nombre de modules aura changé — c'est normal, ce n'est pas un critère.

- [ ] **Step 8 : Commit**

```powershell
git add -A
git commit -F .git/COMMIT_MSG_TMP
```

en ayant d'abord écrit dans `.git/COMMIT_MSG_TMP` un message décrivant : la montée SDK 55, le retrait des appels `NavigationBar`, l'ajout de `--environment`, et le résultat de la barrière.

---

## Task 3 : Palier 56 (React Native 0.85) — le palier lourd

**Files:**
- Modifier : `package.json`, les 5 écrans listés plus haut, `eas.json`

- [ ] **Step 1 : Monter le paquet expo**

```powershell
npx expo install expo@^56.0.0
npx expo install --fix
```

- [ ] **Step 2 : Neutraliser le changement de fetch avant tout test**

Le SDK 56 fait d'`expo/fetch` le `globalThis.fetch` par défaut, ce qui change l'implémentation réseau sous Supabase et sous la récupération des `.ics`. Décision de la spec : opt-out maintenant, migration séparée plus tard.

Ajouter dans `eas.json`, dans chacun des trois profils de `build` (`development`, `preview`, `production`) :

```json
"env": { "EXPO_PUBLIC_USE_RN_FETCH": "1" }
```

et pour le développement local, créer ou compléter `.env` à la racine :

```
EXPO_PUBLIC_USE_RN_FETCH=1
```

- [ ] **Step 3 : Recenser les sites d'import avant codemod**

```powershell
Get-ChildItem -Recurse -Include *.ts,*.tsx | Where-Object { $_.FullName -notmatch 'node_modules|dist' } | Select-String -Pattern "@react-navigation/"
```

**Noter le nombre exact de lignes.** Il sert à vérifier le codemod à l'étape 5, dont on sait qu'il est incomplet.

- [ ] **Step 4 : Lancer le codemod**

```powershell
npx expo-codemod sdk-56-expo-router-react-navigation-replace app components context functions
```

- [ ] **Step 5 : Vérifier ce que le codemod a laissé passer**

Le ticket [expo/expo#46481](https://github.com/expo/expo/issues/46481) signale que ce codemod rate environ 25 % des sites d'import. Cette étape n'est donc pas une formalité.

```powershell
Get-ChildItem -Recurse -Include *.ts,*.tsx | Where-Object { $_.FullName -notmatch 'node_modules|dist' } | Select-String -Pattern "@react-navigation/"
```

Attendu : sortie vide. Pour chaque ligne restante, appliquer la correspondance officielle à la main :

| Import d'origine | Remplacement |
|---|---|
| `@react-navigation/bottom-tabs` | `expo-router/js-tabs` |
| `@react-navigation/elements` | `expo-router/react-navigation` |

L'API runtime est inchangée : seuls les chemins de module bougent. `useBottomTabBarHeight` s'importe donc depuis `expo-router/js-tabs` et s'utilise exactement comme avant.

- [ ] **Step 6 : Réévaluer les deux dépendances déclarées au chantier 1**

Si plus aucun fichier n'importe `@react-navigation/*`, les déclarations directes ajoutées au chantier 1 n'ont plus d'objet :

```powershell
npm ls "@react-navigation/bottom-tabs" "@react-navigation/elements" "@react-navigation/native"
```

Ne les retirer que si elles n'apparaissent plus comme pair réclamé par `expo-router` :

```powershell
npm uninstall "@react-navigation/bottom-tabs" "@react-navigation/elements" "@react-navigation/native"
```

Si `npm ls` montre qu'`expo-router` les réclame encore, les conserver — même règle qu'au palier B du chantier 1 : on ne supprime que sur confirmation.

- [ ] **Step 7 : Barrière automatique**

```powershell
npx tsc --noEmit
Write-Output "exit tsc = $LASTEXITCODE"
npx expo export --platform android --output-dir dist --clear
Write-Output "exit export = $LASTEXITCODE"
npx expo-doctor
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
```

C'est ici que `tsc` a le plus de valeur de tout le chantier : si le codemod a raté un import, TypeScript le signale immédiatement puisque le module n'existe plus.

- [ ] **Step 8 : Commit**

Message décrivant : montée SDK 56, opt-out `expo/fetch`, découplage `react-navigation` avec le nombre de sites migrés par le codemod et le nombre repris à la main, et le sort des trois dépendances `@react-navigation/*`.

---

## Task 4 : Palier 57 (React Native 0.86)

- [ ] **Step 1 : Monter**

```powershell
npx expo install expo@^57.0.0
npx expo install --fix
```

- [ ] **Step 2 : Barrière automatique**

```powershell
npx tsc --noEmit
Write-Output "exit tsc = $LASTEXITCODE"
npx expo export --platform android --output-dir dist --clear
Write-Output "exit export = $LASTEXITCODE"
npx expo-doctor
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
```

Expo annonce ce SDK sans rupture. Si quelque chose casse ici, le suspect le plus probable est `react-native-ui-datepicker@2.0.12`, la dépendance la moins alignée sur le SDK — auquel cas évaluer sa v3 comme changement séparé, pas dans ce commit.

- [ ] **Step 3 : Commit**

---

## Task 5 : Migration linear-gradient

**Files:**
- Modifier : `app/login.tsx:5`, `package.json`

Reportée du chantier 1 parce qu'elle touche du code de rendu. Elle a sa place ici, où un rebuild natif a lieu de toute façon.

- [ ] **Step 1 : Installer la version alignée sur Expo**

```powershell
npx expo install expo-linear-gradient
npm uninstall react-native-linear-gradient
```

- [ ] **Step 2 : Corriger l'import**

Dans `app/login.tsx:5`, remplacer :

```typescript
import LinearGradient from 'react-native-linear-gradient';
```

par :

```typescript
import { LinearGradient } from 'expo-linear-gradient';
```

Le passage de l'export par défaut à l'export nommé est le seul changement d'API : les props `colors`, `start`, `end` et `locations` sont identiques.

- [ ] **Step 3 : Vérifier qu'aucun autre usage ne subsiste**

```powershell
Get-ChildItem -Recurse -Include *.ts,*.tsx | Where-Object { $_.FullName -notmatch 'node_modules|dist' } | Select-String -Pattern "linear-gradient|LinearGradient"
```

Attendu : uniquement `app/login.tsx`, avec le nouvel import.

- [ ] **Step 4 : Barrière automatique puis commit**

---

## Task 6 : Validation sur appareil

- [ ] **Step 1 : Relever l'état final**

```powershell
npx expo export --platform android --output-dir dist --clear
Get-ChildItem dist/_expo/static/js/android -File | ForEach-Object { "{0:N2} Mo" -f ($_.Length/1MB) }
Remove-Item -Recurse -Force dist
node -p "'directes = ' + Object.keys(require('./package.json').dependencies).length"
```

- [ ] **Step 2 : Lancer le build EAS**

Un build est indispensable : les modules natifs ont changé de version sur trois SDK, le dev client existant n'est plus représentatif.

```powershell
eas build --platform android --profile preview
```

- [ ] **Step 3 : Vérification manuelle**

Installer l'APK et parcourir :

| Écran | Point d'attention |
|---|---|
| Accueil | dates formatées ; **hauteur de la barre d'onglets** (`useBottomTabBarHeight` migré) |
| Planning | sélecteur de date, balayage entre semaines, marges haute et basse |
| Salle | mêmes contrôles |
| Login | **dégradé de fond** (migration `expo-linear-gradient`), modale CAS |
| Paramètres | défilement, interrupteurs, planification de notification |
| Notifications | marges de sécurité |

Les deux points les plus exposés sont la barre d'onglets et les marges : c'est exactement ce que le découplage `react-navigation` et l'edge-to-edge affectent.

- [ ] **Step 4 : Fusionner**

Après validation sur appareil seulement :

```powershell
git checkout main
git merge --no-ff chore/upgrade-sdk-57
```

---

## Ce que ce plan ne fait pas

- **`@expo/vector-icons` → `@react-native-vector-icons/*`** — déprécié au SDK 56, pas retiré. Douze fichiers concernés : chantier à part.
- **Adoption d'`expo/fetch`** — neutralisée à la tâche 3, à traiter séparément.
- **`react-native-ui-datepicker` v3** — seulement si le palier 57 la casse.
- **Découpage de `parametres.tsx` et `EventList.tsx`** — chantier 3.
