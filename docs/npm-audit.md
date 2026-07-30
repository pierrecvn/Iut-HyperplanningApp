# À propos des alertes `npm audit`

**Dernière revue :** 2026-07-30 · Expo SDK 57.0.9 · React Native 0.86.2

## Ne jamais lancer `npm audit fix --force`

C'est le seul point vraiment important de ce document.

`npm audit` propose comme « correctifs » des **rétrogradations massives**, parce qu'il retient n'importe quelle version dépourvue de l'avis de sécurité — y compris antérieure de dix versions majeures :

| Paquet | Version du projet | « Correctif » proposé par npm |
|---|---|---|
| `expo` | 57.0.9 | `expo@46.0.21` |
| `jest` | 29 | `jest@25.0.0` |
| `jest-expo` | 57 | `jest-expo@32.0.1` |

`npm audit fix --force` ramènerait donc Expo de 57 à 46 et annulerait la montée de SDK. La commande est à éviter sur ce projet.

## État au 2026-07-30 : 32 alertes, aucune n'atteint l'application

| Groupe | Nombre | Où ça vit |
|---|---|---|
| Outillage `@expo/cli`, `@expo/config*`, `xcode`, `uuid` | 11 | machine de développement et serveur de build |
| Grappe `jest` : `jest`, `jest-expo`, `@jest/*`, `babel-jest` | 18 | `devDependencies`, lanceur de tests |
| `glob`, `minimatch`, `brace-expansion` | 3 | tirés par `test-exclude`, dépendance de `jest` |

L'APK ne contient que ce que Metro traverse depuis `expo-router/entry`, soit environ 2070 modules. Ni `jest`, ni `@expo/cli`, ni `xcode` n'en font partie. Le seul avis techniquement notable — `uuid: Missing buffer bounds check` — concerne `xcode`, un outil de manipulation de projets Xcode qui ne s'exécute jamais sur un téléphone.

Aucune de ces alertes n'est donc exploitable contre un utilisateur de l'application.

## Ce qui a déjà été retiré

Quatre dépendances de développement mortes, supprimées le 2026-07-30 (26 paquets avec leurs transitifs) :

| Paquet | Raison |
|---|---|
| `babel-plugin-module-resolver` | jamais configuré dans `babel.config.js` |
| `baseline-browser-mapping` | reliquat de la cible web, abandonnée |
| `react-test-renderer` | non réclamé par `jest-expo` 57, et bloqué en 18 alors que React est en 19 — les deux doivent partager la même version, un test aurait échoué de façon incompréhensible |
| `@types/react-test-renderer` | types du précédent |

Ce retrait n'a supprimé qu'une alerte sur les quatre espérées : `jest` tire la même chaîne `glob → minimatch → brace-expansion` via `test-exclude`.

## Ce qui reste et pourquoi on n'y touche pas

Supprimer `jest` et `jest-expo` éliminerait 21 des 32 alertes. C'est un mauvais échange : le projet n'a aucun test aujourd'hui, mais `functions/eventFormat.ts` et `functions/groupDisplay.ts` ont justement été extraits en fonctions pures pour être testables. Retirer le lanceur de tests fermerait cette porte pour gagner un chiffre dans un rapport qui ne décrit aucun risque réel.

Ces alertes se résoudront d'elles-mêmes quand `jest-expo` suivra `jest` 30, et quand Expo mettra à jour `xcode`.

## Que faire à la prochaine revue

1. `npx expo install --fix` d'abord — il aligne les versions sur le SDK et résout souvent une partie des alertes au passage.
2. `npm audit` ensuite, en classant par **atteignabilité** et non par gravité : une faille « haute » dans un lanceur de tests qui ne s'exécute jamais compte moins qu'une « modérée » dans du code embarqué.
3. Ne jamais utiliser `--force`.
