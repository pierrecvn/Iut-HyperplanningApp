import { prochainCoursDepuisFenetre } from '@/functions/widgetStore';
import { ProchainCoursWidget } from '@/widgets/ProchainCoursWidget';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

dayjs.locale('fr');

/**
 * Point d'entrée du widget, exécuté par Android hors de l'application.
 *
 * Ce gestionnaire tourne dans un contexte JavaScript sans état React : ni
 * contexte, ni navigation, ni données en mémoire. Tout vient de la fenêtre
 * persistée par functions/widgetStore.
 *
 * Le cours affiché est recalculé ici à chaque rendu plutôt que lu tel quel :
 * Android impose 30 minutes minimum entre deux rafraîchissements périodiques,
 * donc une valeur figée afficherait un cours terminé pendant une demi-heure.
 */

function contenuDuWidget() {
    const cours = prochainCoursDepuisFenetre();

    if (!cours) return null;

    const debut = dayjs(cours.start);
    const fin = dayjs(cours.end);
    const maintenant = dayjs();

    return {
        titre: cours.summary,
        horaire: `${debut.format('ddd D MMM')} · ${debut.format('HH:mm')} - ${fin.format('HH:mm')}`,
        salle: cours.location || 'Salle non précisée',
        enCours: debut.isBefore(maintenant) && fin.isAfter(maintenant),
    };
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
    if (props.widgetInfo.widgetName !== 'ProchainCours') return;

    switch (props.widgetAction) {
        case 'WIDGET_ADDED':
        case 'WIDGET_UPDATE':
        case 'WIDGET_RESIZED':
            props.renderWidget(<ProchainCoursWidget cours={contenuDuWidget()} />);
            break;

        case 'WIDGET_CLICK':
            // Le lanceur ouvre déjà l'application via le clickAction déclaré
            // sur le widget ; rien à faire ici pour l'instant.
            break;

        case 'WIDGET_DELETED':
            break;
    }
}
