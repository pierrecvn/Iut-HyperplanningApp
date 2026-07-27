# Chantier 1 — Hygiène, dépendances fantômes & purge

**Date :** 2026-07-27
**Statut :** en attente de relecture
**Branche cible :** `chore/hygiene-deps`

## Contexte

L'app est sur Expo SDK 54 alors que le SDK 57 est disponible. Avant d'entreprendre cette montée de version (chantier 2), l'audit du `package.json` a révélé trois problèmes qui la feraient échouer ou la rendraient indébogable.

Ce chantier ne change **aucun comportement applicatif**. Il assainit la surface de dépendances pour que l'upgrade qui suit soit lisible : quand quelque chose cassera, on saura que c'est l'upgrade qui l'a cassé.

## Problèmes traités

### P1 — Dépendances fantômes (bloquant pour l'upgrade)

Trois modules sont importés par le code mais absents de `package.json`. Ils ne se résolvent aujourd'hui que grâce au hoisting npm, qui les remonte à la racine de `node_modules` depuis les dépendances qui les tirent réellement.

| Module | Fichiers concernés | Tiré transitivement par |
|---|---|---|
| `dayjs` | 11 | `react-native-ui-datepicker` |
| `@react-navigation/bottom-tabs` | 5 | `expo-router` |
| `@react-navigation/elements` | 5 | `expo-router` |

Le risque est concret : `react-native-ui-datepicker` v3 — la majeure que l'upgrade va installer — ne dépend plus de `dayjs` de façon fixe. Au moment de l'upgrade, `dayjs` disparaîtra de l'arbre de dépendances et les 11 fichiers casseront simultanément, avec une erreur de résolution pointant vers un module sans rapport apparent avec le code fautif.

### P2 — Dépendances mortes (dont une bloquante)

Environ vingt paquets n'ont aucun import dans le code. Deux comptent pour la suite :

- **`react-native-fs`** n'est plus maintenue et ne supporte pas la New Architecture. React Native 0.86, qu'installe le SDK 57, est New Arch uniquement. Cette dépendance bloquerait donc l'upgrade — alors qu'elle n'est pas utilisée.
- **`node-ical`** est vraisemblablement la raison d'être des huit polyfills Node présents (`buffer`, `events`, `process`, `readable-stream`, `path-browserify`, `querystring-es3`, `url`, `util`). Seul `ical.js` est réellement importé.

Nuance importante sur ces polyfills : `metro.config.js` ne définit aucun `extraNodeModules`, mais cela ne les rend **pas** inertes pour autant. Le resolver par défaut de Metro résout un `require('buffer')` nu vers `node_modules/buffer` dès lors que le paquet est installé, sans câblage explicite. Si une dépendance transitive — `ical.js`, `@supabase/supabase-js` — effectue un tel `require`, le polyfill est porteur et sa suppression casse le bundle.

Ces huit paquets sont donc supprimés dans un **commit isolé**, et la construction du bundle Metro sert de garde-fou. Si elle échoue sur un `Unable to resolve module`, seul ce commit est annulé, sans toucher au reste de la purge.

### P3 — Plugin Babel sur un chemin déprécié

`babel.config.js:5` déclare `react-native-reanimated/plugin`. Depuis Reanimated 4 — installé ici en 4.1.6 — ce plugin a été déplacé vers `react-native-worklets/plugin`.

Vérification faite, **ce n'est pas un bug** : `node_modules/react-native-reanimated/plugin/index.js` est un ré-export d'une ligne vers le nouveau chemin. La configuration actuelle fonctionne.

Le changement est donc préventif et non correctif. Il est fait maintenant parce que le SDK 57 embarque Reanimated 4.5 et que ce shim de compatibilité est destiné à disparaître : le corriger ici évite d'avoir à diagnostiquer une erreur de configuration Babel au milieu d'une montée de version qui en produira déjà assez.

### P4 — Bruit Git

55 fichiers apparaissent modifiés dans `git status` pour un changement de mode Unix `755 → 644` uniquement, sans aucune ligne modifiée. Ce bruit rend illisible tout diff de vérification.

## Décisions

### Purge en deux paliers

Les suppressions sont séparées selon leur niveau de certitude. Le palier A ne demande aucune vérification, le palier B en demande une avant de trancher.

**Palier A — suppression directe** (aucun import, aucun rôle transitif ni de configuration) :

`react-native-fs` · `node-ical` · `react-native-worklets-core` · `react-native-draggable-flatlist` · `react-native-crypto` · `base64-arraybuffer` · `date-fns` · `expo-background-fetch` · `expo-image-picker` · `expo-local-authentication` · `expo-haptics` · `react-dom` · `react-native-web`

**Palier A′ — polyfills Node, commit isolé** (voir la nuance Metro en P2) :

`buffer` · `events` · `process` · `readable-stream` · `path-browserify` · `querystring-es3` · `url` · `util`

Note sur `expo-background-fetch` : dépréciée depuis le SDK 53 au profit d'`expo-background-task`, qui est déjà installée, déjà déclarée dans les plugins d'`app.json`, et seule utilisée par `NotificationService.ts`.

**Palier B — vérifier avant de trancher** (aucun import direct, mais rôle possible comme pair transitif ou via la configuration Expo) :

| Paquet | Raison du doute |
|---|---|
| `expo-constants` | pair fréquent d'`expo-notifications` |
| `expo-device` | pair fréquent d'`expo-notifications` |
| `expo-file-system` | pair possible d'`expo-updates` |
| `expo-linking` | pair d'`expo-router` |
| `expo-status-bar` | aucun import, mais sans coût |
| `expo-system-ui` | piloté par la configuration `app.json`, pas par un import |
| `zustand` | importé pour le seul type `StateStorage` dans `functions/supabase.ts` |

Chaque paquet du palier B est conservé par défaut. Il n'est supprimé que si `npm ls <paquet>` confirme qu'aucune dépendance ne le réclame comme pair.

Cas particulier de `zustand` : l'export `zustandStorage` de `functions/supabase.ts:12` n'est importé nulle part, et `zustand` ne sert qu'à typer cet export mort. Décision : supprimer l'export `zustandStorage` et la dépendance. Si un usage futur apparaît, l'interface se réécrit en cinq lignes localement.

### Cible web — abandonnée

L'utilisateur a confirmé ne pas utiliser la cible web. `react-dom` et `react-native-web` passent donc au palier A.

Le bloc `web` d'`app.json` est également supprimé : conserver la configuration d'une cible qui ne peut plus se construire est trompeur pour quiconque relira le fichier. `assets/images/favicon.png`, qui n'était référencé que par ce bloc, est supprimé avec lui.

Conséquence assumée : `npx expo start --web` ne fonctionnera plus. C'est le but.

### `react-native-linear-gradient`

Utilisée dans `app/login.tsx:5` uniquement. Il s'agit d'une bibliothèque RN nue, là où `expo-linear-gradient` est alignée sur le cycle de version du SDK et testée à chaque release Expo. La migration est un changement d'import et un passage de l'export par défaut à un export nommé.

Cette migration est **hors du périmètre de ce chantier** : elle modifie du code de rendu, donc un comportement observable, alors que tout le reste de ce chantier est à comportement constant. Elle est traitée au chantier 2, où un rebuild natif a lieu de toute façon.

### Ce qui n'est pas fait ici

- Aucune montée de version de quoi que ce soit — c'est le chantier 2.
- Aucun découpage de fichier — c'est le chantier 3.
- Aucune correction de `metro.config.js` : sans `node-ical`, la configuration actuelle est correcte telle quelle.

## Plan d'exécution

L'ordre est contraint : la baseline doit être établie avant toute modification, sinon on ne peut pas distinguer une régression introduite d'une anomalie préexistante.

1. **Neutraliser le bruit Git** — `git config core.fileMode false`, puis vérifier que `git status` est propre.
2. **Établir la baseline** — `npm ci`, puis capturer les sorties de `npx tsc --noEmit` et `npx expo-doctor` dans leur état actuel. Ces sorties sont la référence de comparaison.
3. **Déclarer les fantômes** — ajouter `dayjs`, `@react-navigation/bottom-tabs` et `@react-navigation/elements` en dépendances directes, aux versions exactes actuellement résolues dans `node_modules` (relevées via `npm ls`), pour garantir qu'aucun comportement ne change.
4. **Corriger le plugin Babel** — remplacer `react-native-reanimated/plugin` par `react-native-worklets/plugin`.
5. **Purger le palier A** — une seule désinstallation groupée.
6. **Purger le palier A′** — les polyfills Node, dans un commit à part, suivi immédiatement d'une construction du bundle Metro.
7. **Retirer la cible web** — supprimer le bloc `web` d'`app.json` et `assets/images/favicon.png`.
8. **Arbitrer le palier B** — `npm ls` sur chaque paquet, supprimer ceux dont personne ne dépend.
9. **Vérifier.**

## Vérification

Le critère de succès est l'absence de régression, pas l'absence d'erreurs : le projet peut très bien avoir des erreurs TypeScript préexistantes, auquel cas elles doivent rester **identiques**, ni plus ni moins.

| Contrôle | Attendu |
|---|---|
| `npx tsc --noEmit` | sortie identique à la baseline de l'étape 2 |
| `npx expo-doctor` | aucune nouvelle alerte par rapport à la baseline |
| `npm ls dayjs @react-navigation/bottom-tabs @react-navigation/elements` | résolus en dépendances directes, sans `UNMET` |
| `npx expo start --clear` | le bundle Metro se construit sans erreur de résolution |
| Lancement sur appareil | login, planning, salle, paramètres, notifications s'ouvrent ; le sélecteur de date et les gestes de balayage fonctionnent |

Le dernier point est le seul qui ne s'automatise pas et le seul qui compte vraiment : la purge touche des paquets que le bundler peut résoudre sans que la fonctionnalité marche pour autant. Un passage manuel sur les cinq écrans est requis avant de considérer le chantier terminé.

En cas de doute sur une régression, `git stash` puis relecture de la baseline permet de trancher immédiatement.

## Risques

| Risque | Probabilité | Parade |
|---|---|---|
| Un paquet du palier A est utilisé par du code natif ou une configuration hors de la portée du grep | faible | `expo-doctor` et le build Metro le révèlent ; `git revert` du commit de purge |
| Une version de fantôme épinglée diverge de la résolution actuelle | faible | les versions sont relevées depuis `node_modules`, pas choisies |
| Un `require` nu de polyfill dans une dépendance transitive casse le bundle | **moyenne** | palier A′ isolé dans son propre commit + construction Metro immédiate ; `react-native-url-polyfill/auto` est conservée dans tous les cas |

Chaque étape fait l'objet d'un commit séparé, ce qui rend le retour arrière granulaire.

## Suite

Une fois ce chantier vérifié : chantier 2 — montée Expo SDK 54 → 57, sur une surface réduite d'environ un tiers des paquets.
