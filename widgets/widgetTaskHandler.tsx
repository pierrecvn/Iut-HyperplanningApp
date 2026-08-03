import { ProchainCoursWidget } from '@/widgets/ProchainCoursWidget';
import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

/**
 * Point d'entrée du widget, exécuté par Android hors de l'application.
 *
 * Ce gestionnaire tourne dans un contexte JS sans état React : ni contexte, ni
 * navigation, ni données en mémoire. Tout ce qu'il affiche doit venir d'un
 * stockage persistant.
 *
 * À ce stade il rend des valeurs figées : l'objectif du test est de vérifier
 * que la chaîne compile et s'affiche sous React Native 0.86, pas encore de
 * brancher les vraies données.
 */
const widgets = {
    ProchainCours: ProchainCoursWidget,
} as const;

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
    const nom = props.widgetInfo.widgetName as keyof typeof widgets;
    const Widget = widgets[nom];

    if (!Widget) return;

    switch (props.widgetAction) {
        case 'WIDGET_ADDED':
        case 'WIDGET_UPDATE':
        case 'WIDGET_RESIZED':
            props.renderWidget(
                <Widget
                    titre="Rentrée - IUT 2e année"
                    horaire="mar. 1 sept. · 10:00 - 12:00"
                    salle="IUTC-amphi 5"
                />
            );
            break;

        case 'WIDGET_DELETED':
        case 'WIDGET_CLICK':
            break;
    }
}
