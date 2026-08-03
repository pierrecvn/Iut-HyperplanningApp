import { createMMKV } from 'react-native-mmkv';

/**
 * Clarté du thème, persistée pour le widget d'écran d'accueil.
 *
 * Comme la fenêtre d'événements, cette valeur passe par le stockage : le
 * gestionnaire du widget tourne hors de l'application et ne peut pas lire
 * ThemeContext.
 *
 * On persiste un booléen et non la palette du thème actif. Les thèmes
 * fantaisie de l'application (orange, bleu…) sont réglés pour un écran plein,
 * pas pour une vignette de 180×110dp posée sur un fond d'écran quelconque :
 * leurs accents n'y tiennent pas le contraste. Le widget garde donc ses deux
 * palettes, et ne suit du thème que le clair/sombre.
 */

const CLE_SOMBRE = 'widget_theme_sombre';

const storage = createMMKV();

/** Le widget est né en sombre : c'est le repli tant que rien n'a été écrit. */
export function themeWidgetSombre(): boolean {
    try {
        return storage.getBoolean(CLE_SOMBRE) ?? true;
    } catch (error) {
        console.error('Lecture du thème widget impossible', error);
        return true;
    }
}

export function enregistrerThemeWidget(sombre: boolean): void {
    try {
        storage.set(CLE_SOMBRE, sombre);
    } catch (error) {
        // Le widget est accessoire : son stockage ne doit jamais faire échouer
        // le changement de thème de l'application.
        console.error('Enregistrement du thème widget impossible', error);
    }
}
