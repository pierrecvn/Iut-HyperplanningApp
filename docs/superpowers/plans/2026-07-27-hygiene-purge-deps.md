# Chantier 1 — Hygiène, dépendances fantômes & purge : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Assainir la surface de dépendances de l'app — déclarer 3 dépendances fantômes, supprimer ~28 paquets morts, corriger le plugin Babel — sans modifier aucun comportement applicatif, afin que la montée Expo SDK 54 → 57 qui suit soit débogable.

**Architecture:** Aucun test unitaire n'existe dans ce projet et ce chantier n'ajoute aucune logique, donc le cycle TDD classique ne s'applique pas. Son équivalent ici est le **relevé de référence** : on capture la sortie de `tsc` et d'`expo-doctor` *avant* toute modification, et chaque tâche se valide en comparant à cette référence. Le critère n'est jamais « zéro erreur » mais « aucune erreur nouvelle ». La construction du bundle Metro (`expo export`) sert de garde-fou de résolution, exécutée sans appareil ni émulateur.

**Tech Stack:** Expo SDK 54, React Native 0.81, TypeScript 5.4, npm, EAS.

**Spec :** `docs/superpowers/specs/2026-07-27-hygiene-purge-deps-design.md`

**Note sur le shell :** les commandes sont données pour PowerShell (shell principal du projet). `tsc` et `expo-doctor` écrivent leurs diagnostics sur stdout, donc aucune redirection `2>&1` n'est nécessaire — et elle serait nuisible en PowerShell 5.1.

---

## Fichiers touchés

| Fichier | Nature | Responsabilité après changement |
|---|---|---|
| `package.json` | Modifier | Refléter les dépendances réellement utilisées, ni plus ni moins |
| `package-lock.json` | Modifier | Régénéré par npm à chaque étape |
| `babel.config.js:5` | Modifier | Pointer le plugin worklets au bon chemin |
| `app.json:33-37` | Modifier | Retirer le bloc `web` |
| `functions/supabase.ts:5,12-23` | Modifier | Retirer l'export mort `zustandStorage` et son import `zustand` |
| `assets/images/favicon.png` | Supprimer | Référencé uniquement par le bloc `web` |
| `.git/config` | Modifier | `core.fileMode false` (local, non versionné) |

Aucun fichier créé. Aucun fichier de test — il n'en existe pas dans ce projet, et ce chantier n'est pas le bon moment pour en introduire (ce serait mélanger deux intentions dans un même diff).

---

## Task 0 : Branche et neutralisation du bruit Git

**Files:**
- Modifier : `.git/config` (local)

- [ ] **Step 1 : Créer la branche de travail**

```powershell
git checkout -b chore/hygiene-deps
```

- [ ] **Step 2 : Constater le bruit avant correction**

```powershell
git status --short
```

Attendu : environ 55 fichiers marqués `M`, alors qu'aucun contenu n'a changé.

- [ ] **Step 3 : Désactiver le suivi du bit exécutable**

```powershell
git config core.fileMode false
```

- [ ] **Step 4 : Vérifier que le bruit a disparu**

```powershell
git status --short
```

Attendu : sortie vide. Si des fichiers restent listés, ils ont de vraies modifications — les inspecter avec `git diff` avant d'aller plus loin, et ne pas continuer tant que l'arbre n'est pas propre.

Aucun commit ici : `core.fileMode` est une configuration locale, elle ne se versionne pas.

---

## Task 1 : Relevé de référence

**Files:** aucun (lecture seule)

Cette tâche ne modifie rien. Elle produit les deux fichiers de référence auxquels toutes les vérifications suivantes se comparent. Ne pas la sauter : sans elle, il devient impossible de distinguer une régression introduite d'une anomalie préexistante.

- [ ] **Step 1 : Installer les dépendances**

```powershell
npm ci
```

Attendu : installation complète sans `ERESOLVE`. `node_modules` était absent au départ.

- [ ] **Step 2 : Capturer la référence TypeScript**

```powershell
npx tsc --noEmit | Tee-Object -FilePath "$env:TEMP\hp-tsc-baseline.txt"
```

Attendu : la commande peut sortir en code 1 s'il y a des erreurs préexistantes — **c'est normal et ce n'est pas un échec de cette étape**. Le but est d'enregistrer l'état, quel qu'il soit.

- [ ] **Step 3 : Compter les erreurs de référence**

```powershell
(Get-Content "$env:TEMP\hp-tsc-baseline.txt" | Select-String "error TS").Count
```

Noter ce nombre. Il s'appelle `N_BASELINE` dans la suite du plan.

- [ ] **Step 4 : Capturer la référence expo-doctor**

```powershell
npx expo-doctor | Tee-Object -FilePath "$env:TEMP\hp-doctor-baseline.txt"
```

Attendu : `expo-doctor` signalera très probablement déjà les dépendances fantômes et des versions non alignées. C'est le point de départ, pas un problème.

- [ ] **Step 5 : Vérifier que `dist/` est ignoré par Git**

```powershell
Select-String -Path .gitignore -Pattern "dist" -Quiet
```

Attendu : `True`. Si `False`, ajouter `dist/` à `.gitignore` — les étapes suivantes produisent ce répertoire via `expo export` et il ne doit pas être versionné.

- [ ] **Step 6 : Établir la référence de construction du bundle**

```powershell
npx expo export --platform android --output-dir dist-baseline
```

Attendu : `Exporting bundle` puis succès. Si cette commande échoue **avant** toute modification, arrêter le plan et diagnostiquer — le projet est déjà cassé et ce chantier n'est pas le bon outil.

- [ ] **Step 7 : Nettoyer la sortie de référence**

```powershell
Remove-Item -Recurse -Force dist-baseline
```

---

## Task 2 : Déclarer les trois dépendances fantômes

**Files:**
- Modifier : `package.json` (bloc `dependencies`)

C'est la tâche la plus importante du chantier. `dayjs` est importé par 11 fichiers sans être déclaré ; il ne se résout que par hoisting depuis `react-native-ui-datepicker`, dont la v3 ne le tire plus.

- [ ] **Step 1 : Relever les versions actuellement résolues**

```powershell
node -p "require('dayjs/package.json').version"
node -p "require('@react-navigation/bottom-tabs/package.json').version"
node -p "require('@react-navigation/elements/package.json').version"
```

Noter les trois versions. Elles sont reprises telles quelles à l'étape suivante : on épingle ce qui tourne déjà, on ne choisit pas de nouvelles versions. C'est ce qui garantit qu'aucun comportement ne change.

- [ ] **Step 2 : Confirmer qu'elles sont bien fantômes**

```powershell
Select-String -Path package.json -Pattern "dayjs|bottom-tabs|navigation/elements"
```

Attendu : aucune correspondance. Cela confirme le diagnostic avant d'agir.

- [ ] **Step 3 : Les déclarer en dépendances directes**

Remplacer `<V_DAYJS>`, `<V_TABS>` et `<V_ELEMENTS>` par les versions relevées à l'étape 1 :

```powershell
npm install --save-exact dayjs@<V_DAYJS> "@react-navigation/bottom-tabs@<V_TABS>" "@react-navigation/elements@<V_ELEMENTS>"
```

L'épinglage exact est délibéré : il fige le comportement actuel. Le chantier 2 les réalignera via `expo install --fix`.

- [ ] **Step 4 : Vérifier la résolution en dépendance directe**

```powershell
npm ls dayjs "@react-navigation/bottom-tabs" "@react-navigation/elements"
```

Attendu : les trois apparaissent au premier niveau sous `iut-hyperplanningapp@1.1.6`, sans mention `UNMET DEPENDENCY` ni `extraneous`.

- [ ] **Step 5 : Vérifier l'absence de régression TypeScript**

```powershell
npx tsc --noEmit | Tee-Object -FilePath "$env:TEMP\hp-tsc-t2.txt"
(Get-Content "$env:TEMP\hp-tsc-t2.txt" | Select-String "error TS").Count
```

Attendu : exactement `N_BASELINE`. Un nombre supérieur signale une régression — comparer les deux fichiers avec `Compare-Object` avant de continuer.

- [ ] **Step 6 : Commit**

```powershell
git add package.json package-lock.json
git commit -m @'
fix: déclare dayjs et @react-navigation/* en dépendances directes

Ces trois modules étaient importés par le code mais absents de
package.json, résolus uniquement par hoisting npm. react-native-ui-datepicker
v3 ne dépend plus de dayjs : sans cette déclaration, la montée SDK 57
casserait les 11 fichiers qui l'importent.

Versions épinglées sur ce qui était déjà résolu : aucun changement de
comportement.
'@
```

---

## Task 3 : Corriger le chemin du plugin Babel

**Files:**
- Modifier : `babel.config.js:5`

Depuis Reanimated 4 — installé ici en 4.1 — le plugin Babel a été déplacé vers `react-native-worklets/plugin`. Le projet utilise encore l'ancien chemin.

- [ ] **Step 1 : Vérifier que le paquet cible est bien présent**

```powershell
npm ls react-native-worklets
```

Attendu : `react-native-worklets@0.7.x`. C'est ce paquet qui fournit désormais le plugin, et `app/(auth)/(tabs)/planning.tsx:21` l'importe déjà pour `runOnJS`.

- [ ] **Step 2 : Modifier le fichier**

`babel.config.js` doit devenir exactement :

```javascript
module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: ['react-native-worklets/plugin'],

    };
};
```

- [ ] **Step 3 : Reconstruire le bundle avec le cache vidé**

Le cache Babel doit être invalidé, sinon la modification n'est pas prise en compte :

```powershell
npx expo export --platform android --output-dir dist-t3 --clear
```

Attendu : succès. Une erreur mentionnant `react-native-reanimated/plugin` introuvable signifierait l'inverse du diagnostic — dans ce cas, revenir à l'ancien chemin et signaler.

- [ ] **Step 4 : Nettoyer**

```powershell
Remove-Item -Recurse -Force dist-t3
```

- [ ] **Step 5 : Commit**

```powershell
git add babel.config.js
git commit -m @'
fix: pointe le plugin Babel vers react-native-worklets

Depuis Reanimated 4 (installé en 4.1), le plugin a migré de
react-native-reanimated/plugin vers react-native-worklets/plugin.
Le projet était resté sur l'ancien chemin depuis le SDK 54.
'@
```

---

## Task 4 : Purger le palier A (13 paquets)

**Files:**
- Modifier : `package.json`

Ces treize paquets n'ont aucun import dans le code, aucun rôle de configuration et aucun rôle de pair transitif. `react-native-fs` est la plus importante : non maintenue, incompatible New Architecture, elle bloquerait à elle seule la montée vers React Native 0.86.

- [ ] **Step 1 : Confirmer l'absence totale d'import**

```powershell
Get-ChildItem -Recurse -Include *.ts,*.tsx,*.js | Where-Object { $_.FullName -notmatch 'node_modules|dist' } | Select-String -Pattern "react-native-fs|node-ical|worklets-core|draggable-flatlist|react-native-crypto|base64-arraybuffer|date-fns|background-fetch|image-picker|local-authentication|expo-haptics|react-dom|react-native-web"
```

Attendu : aucune sortie. Toute correspondance doit être examinée et le paquet concerné retiré de la liste de l'étape 2.

- [ ] **Step 2 : Désinstaller**

```powershell
npm uninstall react-native-fs node-ical react-native-worklets-core react-native-draggable-flatlist react-native-crypto base64-arraybuffer date-fns expo-background-fetch expo-image-picker expo-local-authentication expo-haptics react-dom react-native-web
```

- [ ] **Step 3 : Vérifier l'absence de régression TypeScript**

```powershell
npx tsc --noEmit | Tee-Object -FilePath "$env:TEMP\hp-tsc-t4.txt"
(Get-Content "$env:TEMP\hp-tsc-t4.txt" | Select-String "error TS").Count
```

Attendu : `N_BASELINE`.

- [ ] **Step 4 : Vérifier que le bundle se construit toujours**

```powershell
npx expo export --platform android --output-dir dist-t4
Remove-Item -Recurse -Force dist-t4
```

Attendu : succès.

- [ ] **Step 5 : Commit**

```powershell
git add package.json package-lock.json
git commit -m @'
chore: supprime 13 dépendances mortes

Aucune n'est importée par le code. react-native-fs est la plus
critique : non maintenue et incompatible New Architecture, elle
bloquerait la montée vers React Native 0.86.

expo-background-fetch est dépréciée depuis le SDK 53 au profit
d'expo-background-task, déjà installée et seule utilisée.
react-dom et react-native-web partent avec l'abandon de la cible web.
'@
```

---

## Task 5 : Purger le palier A′ — les polyfills Node (commit isolé)

**Files:**
- Modifier : `package.json`

Ces huit paquets sont isolés dans leur propre commit pour une raison précise : `metro.config.js` ne définit aucun `extraNodeModules`, mais le resolver par défaut de Metro résout malgré tout un `require('buffer')` nu vers `node_modules/buffer` dès lors que le paquet est installé. Si une dépendance transitive en fait usage, la suppression casse le bundle. Le commit séparé rend l'annulation chirurgicale.

- [ ] **Step 1 : Confirmer l'absence d'usage dans le code du projet**

```powershell
Get-ChildItem -Recurse -Include *.ts,*.tsx,*.js | Where-Object { $_.FullName -notmatch 'node_modules|dist' } | Select-String -Pattern "require\('(buffer|events|process|readable-stream|path-browserify|querystring-es3|url|util)'\)|from '(buffer|events|process|readable-stream|path-browserify|querystring-es3|url|util)'"
```

Attendu : aucune sortie. Cela ne dit rien des dépendances transitives — c'est l'étape 3 qui tranche.

- [ ] **Step 2 : Désinstaller**

```powershell
npm uninstall buffer events process readable-stream path-browserify querystring-es3 url util
```

`react-native-url-polyfill` n'est **pas** dans cette liste : elle est importée par `functions/supabase.ts:4` et doit être conservée.

- [ ] **Step 3 : Garde-fou — construire le bundle**

```powershell
npx expo export --platform android --output-dir dist-t5 --clear
```

Attendu : succès.

**En cas d'échec `Unable to resolve module <nom>` :** c'est le scénario anticipé. Réinstaller uniquement le paquet nommé dans l'erreur, puis relancer :

```powershell
npm install <nom>
npx expo export --platform android --output-dir dist-t5 --clear
```

Répéter jusqu'à succès. Consigner dans le message de commit quels polyfills ont dû être conservés et pourquoi.

- [ ] **Step 4 : Nettoyer**

```powershell
Remove-Item -Recurse -Force dist-t5
```

- [ ] **Step 5 : Commit**

```powershell
git add package.json package-lock.json
git commit -m @'
chore: supprime les polyfills Node hérités de node-ical

Ces 8 paquets accompagnaient node-ical, supprimée au commit précédent.
Seule ical.js est réellement utilisée et n'en a pas besoin.

Commit isolé volontairement : le resolver Metro résout un require nu
vers node_modules même sans extraNodeModules, donc une dépendance
transitive pouvait en dépendre. Bundle Metro vérifié.
'@
```

---

## Task 6 : Retirer la cible web

**Files:**
- Modifier : `app.json` (bloc `web`, lignes 33-37)
- Supprimer : `assets/images/favicon.png`

- [ ] **Step 1 : Retirer le bloc `web` d'`app.json`**

Supprimer ces cinq lignes, ainsi que la virgule terminant le bloc `android` qui les précède si elle devient orpheline :

```json
        "web": {
            "bundler": "metro",
            "output": "static",
            "favicon": "./assets/images/favicon.png"
        },
```

- [ ] **Step 2 : Vérifier que le JSON reste valide**

```powershell
node -p "JSON.parse(require('fs').readFileSync('app.json','utf8')).expo.web"
```

Attendu : `undefined`. Une exception de parsing signale une virgule mal placée.

- [ ] **Step 3 : Confirmer que le favicon n'est plus référencé**

```powershell
Get-ChildItem -Recurse -Include *.json,*.ts,*.tsx,*.js | Where-Object { $_.FullName -notmatch 'node_modules|package-lock|dist' } | Select-String -Pattern "favicon"
```

Attendu : aucune sortie.

- [ ] **Step 4 : Supprimer le fichier**

```powershell
git rm assets/images/favicon.png
```

- [ ] **Step 5 : Vérifier que le bundle Android se construit toujours**

```powershell
npx expo export --platform android --output-dir dist-t6
Remove-Item -Recurse -Force dist-t6
```

Attendu : succès. La cible Android est indépendante du bloc `web`.

- [ ] **Step 6 : Commit**

```powershell
git add app.json
git commit -m @'
chore: abandonne la cible web

L'app est distribuée en APK via EAS et aucun script ne cible le web.
Conserver la configuration d'une cible qui ne peut plus se construire
(react-dom et react-native-web ayant été supprimées) serait trompeur.

expo start --web ne fonctionne plus, volontairement.
'@
```

---

## Task 7 : Arbitrer le palier B

**Files:**
- Modifier : `package.json`
- Modifier : `functions/supabase.ts:5,12-23`

Ces paquets n'ont aucun import direct mais peuvent servir de pair transitif. Chacun est conservé par défaut ; il n'est supprimé que si `npm ls` confirme que personne ne le réclame.

- [ ] **Step 1 : Interroger l'arbre de dépendances**

```powershell
npm ls expo-constants expo-device expo-file-system expo-linking expo-status-bar expo-system-ui
```

Lire la sortie paquet par paquet :
- s'il apparaît **uniquement** au premier niveau → personne n'en dépend → candidat à la suppression ;
- s'il apparaît **imbriqué sous un autre paquet** (typiquement `expo-notifications` ou `expo-router`) → il est requis comme pair → **conserver**.

- [ ] **Step 2 : Désinstaller uniquement les candidats confirmés**

```powershell
npm uninstall <liste des paquets confirmés à l'étape 1>
```

Si l'étape 1 ne confirme aucun candidat, sauter cette étape — c'est un résultat valide, pas un échec.

- [ ] **Step 3 : Retirer l'export mort `zustandStorage`**

Dans `functions/supabase.ts`, supprimer l'import ligne 5 :

```typescript
import { StateStorage } from 'zustand/middleware';
```

et le bloc lignes 12-23 :

```typescript
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
```

Le reste du fichier — `supabaseStorage` et `createClient` — est inchangé.

- [ ] **Step 4 : Confirmer que l'export n'était importé nulle part**

```powershell
Get-ChildItem -Recurse -Include *.ts,*.tsx | Where-Object { $_.FullName -notmatch 'node_modules|dist' } | Select-String -Pattern "zustandStorage|zustand"
```

Attendu : aucune sortie. Si `zustandStorage` apparaît ailleurs, annuler l'étape 3 et conserver `zustand`.

- [ ] **Step 5 : Désinstaller zustand**

```powershell
npm uninstall zustand
```

- [ ] **Step 6 : Vérifier l'absence de régression TypeScript**

```powershell
npx tsc --noEmit | Tee-Object -FilePath "$env:TEMP\hp-tsc-t7.txt"
(Get-Content "$env:TEMP\hp-tsc-t7.txt" | Select-String "error TS").Count
```

Attendu : `N_BASELINE`.

- [ ] **Step 7 : Commit**

```powershell
git add package.json package-lock.json functions/supabase.ts
git commit -m @'
chore: retire zustand et les dépendances sans réclamant

zustand ne servait qu'à typer zustandStorage, un export que personne
n'importait. L'interface se réécrit localement en cinq lignes si un
besoin apparaît.

Les paquets du palier B confirmés comme pairs transitifs par npm ls
ont été conservés.
'@
```

---

## Task 8 : Vérification finale

**Files:** aucun (lecture seule)

Le critère est l'absence de régression, pas l'absence d'erreurs.

- [ ] **Step 1 : Réinstaller depuis zéro**

```powershell
Remove-Item -Recurse -Force node_modules
npm ci
```

Attendu : succès. Cette réinstallation propre est ce qui prouve que `package-lock.json` est cohérent — les étapes précédentes travaillaient sur un arbre déjà en place, qui pouvait masquer un paquet supprimé mais toujours physiquement présent.

- [ ] **Step 2 : Comparer TypeScript à la référence**

```powershell
npx tsc --noEmit | Tee-Object -FilePath "$env:TEMP\hp-tsc-final.txt"
Compare-Object (Get-Content "$env:TEMP\hp-tsc-baseline.txt") (Get-Content "$env:TEMP\hp-tsc-final.txt")
```

Attendu : aucune ligne marquée `=>` (présente dans le final mais absente de la référence). Des lignes `<=` sont acceptables : ce sont des erreurs qui ont disparu.

- [ ] **Step 3 : Comparer expo-doctor à la référence**

```powershell
npx expo-doctor | Tee-Object -FilePath "$env:TEMP\hp-doctor-final.txt"
Compare-Object (Get-Content "$env:TEMP\hp-doctor-baseline.txt") (Get-Content "$env:TEMP\hp-doctor-final.txt")
```

Attendu : aucune alerte nouvelle. Les alertes sur les dépendances fantômes doivent avoir **disparu**.

- [ ] **Step 4 : Confirmer que les fantômes sont bien résolus**

```powershell
npm ls dayjs "@react-navigation/bottom-tabs" "@react-navigation/elements"
```

Attendu : les trois au premier niveau, sans `UNMET`.

- [ ] **Step 5 : Construire le bundle une dernière fois**

```powershell
npx expo export --platform android --output-dir dist-final --clear
Remove-Item -Recurse -Force dist-final
```

Attendu : succès.

- [ ] **Step 6 : Vérification manuelle sur appareil — obligatoire**

```powershell
npx expo start --clear
```

C'est le seul contrôle qui compte vraiment, et le seul qui ne s'automatise pas : la purge touche des paquets que Metro sait résoudre sans que la fonctionnalité marche pour autant.

Parcourir et confirmer :

| Écran | À vérifier |
|---|---|
| Login | la modale CAS s'ouvre, le dégradé de fond s'affiche |
| Accueil | les événements du jour s'affichent, les dates sont formatées (contrôle direct de `dayjs`) |
| Planning | balayage gauche/droite entre semaines, ouverture du sélecteur de date |
| Salle | même contrôle : balayage et sélecteur de date |
| Paramètres | la liste défile, les interrupteurs réagissent, la planification de notification fonctionne |

Le formatage des dates et le sélecteur de date sont les contrôles les plus importants : ils valident respectivement `dayjs` et `react-native-ui-datepicker`, les deux éléments au cœur du problème des fantômes.

- [ ] **Step 7 : Mesurer le résultat**

```powershell
node -p "const p=require('./package.json'); Object.keys(p.dependencies).length + ' dépendances directes'"
```

Point de départ : **61** dépendances directes. Attendu : **entre 36 et 42**, selon ce que le palier B a confirmé comme pairs transitifs à la tâche 7.

Le calcul : 61 − 13 (palier A) − 8 (palier A′) − 1 (zustand) + 3 (fantômes déclarés) = 42 si le palier B est intégralement conservé, 36 si ses 6 paquets partent tous.

- [ ] **Step 8 : Fusionner**

Une fois l'étape 6 validée sur appareil, et pas avant :

```powershell
git checkout main
git merge --no-ff chore/hygiene-deps
```

---

## Ce que ce plan ne fait pas

Ces points sont volontairement exclus et traités ailleurs :

- **Aucune montée de version** — chantier 2. C'est précisément ce que ce chantier prépare.
- **`react-native-linear-gradient` → `expo-linear-gradient`** — chantier 2, car cette migration touche du code de rendu alors que tout ce plan est à comportement constant.
- **Découpage de `parametres.tsx` (1007 l.) et `EventList.tsx` (659 l.)** — chantier 3.
- **Introduction de tests** — `jest-expo` est configuré mais aucun test n'existe. Les ajouter ici mélangerait deux intentions dans un même diff.
- **Le canal de notification Android `'default'`** — `functions/NotificationService.ts:109` référence un `channelId: 'default'` sans qu'aucun appel à `setNotificationChannelAsync` ne soit visible dans le code. C'est un bug potentiel, à instruire au chantier 4 avec le reste du travail sur les notifications.
