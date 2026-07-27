# Chantier 3 — Découpage de `parametres.tsx`

**Date :** 2026-07-28
**Statut :** en attente de relecture
**Branche cible :** `refactor/decoupage-parametres`
**Prérequis :** chantiers 1 et 2 fusionnés

## Contexte

`app/(auth)/(tabs)/parametres.tsx` fait 1119 lignes. C'est le plus gros fichier du projet et il concentre cinq fonctionnalités sans rapport entre elles : notifications, calendriers, sélection de groupe, apparence et compte.

Répartition constatée :

| Zone | Lignes | Poids |
|---|---|---|
| Imports et constantes | 1-32 | 32 |
| Logique : 14 `useState`, 3 `useEffect`, 9 handlers | 33-295 | 263 |
| JSX : carte profil et sections de réglages | 296-496 | ~200 |
| JSX : 6 modales | 497-993 | ~500 |
| Styles | 994-1116 | 125 |

Ce chantier ne change **aucun comportement**, à une exception explicitement isolée dans son propre commit (voir « Bug latent »).

## Ce que la lecture a révélé

### Les fonctionnalités ne sont pas indépendantes

Un découpage en cinq composants autonomes produirait du prop-drilling, parce que calendriers et groupe sont réellement couplés :

- `handleGroupSelection` (ligne 260) **écrit dans `CalendarService`** — il ajoute le groupe choisi comme calendrier pour qu'il apparaisse dans la vue combinée ;
- `getGroupDisplayName` (ligne 160) **lit `customCalendars`** pour afficher le suffixe « (Perso) » ;
- `handleCasSuccess` (ligne 131) lit `customCalendars`, écrit dans `CalendarService`, **et appelle `handleGroupSelection`**.

Extraire un `GroupSelector` sans traiter ce couplage l'obligerait à recevoir `customCalendars`, `loadCalendars` et `refreshEdt` en props : le désordre serait déplacé, pas supprimé.

**La vraie unité à isoler est donc l'état des calendriers, pas les modales.**

### La section « Général » mélange les fonctionnalités

Le conteneur visuel des lignes 370-438 contient, dans l'ordre : Connexion Université, Gérer mes calendriers, Groupe par défaut, puis les trois réglages de thème, puis À propos. Cinq fonctionnalités dans une seule carte.

Les composants extraits ne peuvent donc pas être des sections autonomes rendant leur propre conteneur : la mise en page changerait. Ils rendent des **fragments de `SettingItem`**, et les conteneurs visuels restent dans `parametres.tsx`.

### `data` est un doublon de `user`

Ligne 229-230 : `const data = user; setData(data);`. L'état `data` est une simple photographie de `user` prise au montage. Les deux ne divergent que si `user` change ensuite.

Ce doublon n'est **pas supprimé** dans ce chantier : le faire changerait la sémantique de rafraîchissement. Il est signalé pour plus tard.

## Architecture cible

### `hooks/useCalendars.ts`

Le hook partagé qui résout le couplage. Il possède l'état `customCalendars`, expose le CRUD (`add`, `remove`, `toggle`, `reload`) et déclenche `refreshEdt()` après chaque mutation.

`CalendarManager` et `GroupSelector` le consomment tous les deux sans se connaître. C'est le point clé du design : les deux fonctionnalités partagent une donnée, pas une implémentation.

### `components/parametres/SettingsSection.tsx`

Composant de présentation : un titre et une carte. Il existe pour que les styles `headerTitle`, `settingsContainer` et `separator` vivent à un seul endroit au lieu d'être recopiés dans chaque composant extrait.

Props : `title`, `titleColor?`, `children`.

### Les cinq composants de fonctionnalité

Chacun rend ses `SettingItem` en fragment **et ses propres modales**. `CustomModal` étant positionné en absolu, sa place dans l'arbre n'a pas d'incidence visuelle.

| Composant | Possède | Modales |
|---|---|---|
| `NotificationSettings` | `notificationStatus`, `scheduledNotifications`, `rappel` | rappels |
| `CalendarManager` | formulaire du nouveau calendrier | gestionnaire, ajout |
| `GroupSelector` | `group`, `groupSearchText`, `persoGroupUrl` | groupe, CAS |
| `AppearanceSettings` | rien — lit `useTheme()` | aucune |
| `AccountSection` | rien — lit `useAuth()` | à propos, suppression |

`parametres.tsx` devient une composition d'environ 120 lignes : `SafeAreaView`, `ScrollView`, la carte profil, et l'assemblage des cinq composants dans leurs `SettingsSection`.

### Décomposition de `activeModal`

L'état unique `activeModal: 'group' | 'calendar' | 'info' | 'rappel' | 'warning' | null` n'existe que parce que tout vit dans un seul fichier. Après découpage, chaque composant possède sa propre visibilité de modale.

Conséquence : deux modales peuvent techniquement s'ouvrir en même temps, ce que le type union interdisait. En pratique elles sont déclenchées par des actions utilisateur distinctes et mutuellement exclusives — sauf au premier lancement, qui est précisément le bug ci-dessous.

## Bug latent trouvé en chemin

Lignes 239-250, à l'initialisation :

```typescript
if (data?.group == null) {
    setActiveModal('group');
    setIsInitialGroupSelection(true);
}
if (data?.rappel == null) {
    setActiveModal('rappel');
}
```

Pour un **nouvel utilisateur n'ayant ni groupe ni rappel**, la seconde affectation écrase la première. La modale de sélection de groupe n'est jamais affichée, alors que `isInitialGroupSelection` est bien passé à `true`.

**Décision :** le découpage préserve ce comportement à l'identique, y compris le bug. La correction fait l'objet d'un **commit séparé, après** le découpage.

La raison est la même qu'au chantier 1 pour `linear-gradient` et au chantier 2 pour `expo/fetch` : ne pas mêler un déplacement de code à comportement constant et un changement de comportement volontaire. Si un écran se met à mal se comporter, on doit pouvoir dire lequel des deux commits en est responsable.

## Second bug latent — la fréquence de rappel qui régresse

Découvert en extrayant `NotificationSettings`. C'est la conséquence concrète du doublon `data` / `user` signalé plus haut.

Il existe **deux sources de vérité** pour la fréquence de rappel :

| Usage | Source |
|---|---|
| Planification réelle des notifications | `data.rappel` — instantané pris au montage |
| Affichage dans l'écran et la modale | `rappel` — état mis à jour à chaque choix |

`setRappel(selectedRappel)` ne met pas `data` à jour. La replanification immédiate qui suit un changement est correcte, puisqu'elle reçoit `selectedRappel` en argument. Mais toute replanification ultérieure relit `data.rappel`.

**Reproduction :** passer le rappel de 15 à 30 minutes, puis désactiver et réactiver les notifications. Les notifications sont replanifiées à 15 minutes alors que l'écran affiche 30.

Même traitement que le bug des modales : le découpage préserve ce comportement à l'identique, la correction va dans le commit séparé de l'étape 7. La correction consiste à supprimer l'état `data` et à lire `user` directement, ou à propager `rappel` comme unique source.

## Plan d'exécution

Un commit par étape, chacun vérifié avant le suivant.

1. **Fondations** — `useCalendars` et `SettingsSection`, sans encore les utiliser ailleurs.
2. **`CalendarManager`** — le bloc le plus autonome, bon banc d'essai pour le hook.
3. **`GroupSelector`** — le plus couplé ; valide que `useCalendars` tient ses promesses.
4. **`NotificationSettings`**
5. **`AppearanceSettings`** et **`AccountSection`** — les deux plus légers, sans état propre.
6. **Allègement de `parametres.tsx`** — il ne reste que la composition.
7. **Correction du bug** de la modale, isolée.

L'ordre n'est pas arbitraire : `CalendarManager` avant `GroupSelector` parce que le premier valide le hook partagé dans le cas simple avant qu'on l'utilise dans le cas difficile.

## Vérification

Pas de tests dans ce projet, et ce chantier n'est pas le bon moment pour en introduire — ce serait mêler deux intentions. Le filet retenu est la vérification manuelle avec rechargement à chaud, décidée avec l'utilisateur.

À chaque étape :

- `npx tsc --noEmit` reste à 0 erreur ;
- Metro recharge sans erreur ;
- l'écran Paramètres est parcouru sur l'appareil.

Le parcours de contrôle, sur téléphone Android 16 déjà connecté :

| Fonctionnalité | À vérifier |
|---|---|
| Notifications | bascule, ouverture des rappels, le compteur de notifications planifiées reste juste |
| Calendriers | ouverture du gestionnaire, ajout avec validation d'URL, suppression, activation |
| Groupe | ouverture, recherche, sélection, le nom affiché reste correct |
| Université | ouverture de la modale CAS |
| Apparence | les trois bascules de thème s'appliquent immédiatement |
| Compte | à propos, déconnexion, modale de suppression |

Le point le plus exposé est l'affichage du nom de groupe : il dépend de `customCalendars`, donc du hook partagé. Si `useCalendars` est mal câblé, c'est là que ça se verra en premier.

## Ce que ce chantier ne fait pas

- **`EventList.tsx` (714 lignes)** — écarté du périmètre. Reste à faire, avec ses trois fonctions pures triviales à extraire.
- **Suppression du doublon `data` / `user`** — signalé, non traité.
- **`SafeAreaView` déprécié** dans `CasLoginModal.tsx:2` — hérité du chantier 2.
- **Introduction de tests** — décision explicite.
