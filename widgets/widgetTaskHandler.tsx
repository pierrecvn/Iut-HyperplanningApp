import { ProchainCoursWidget } from '@/widgets/ProchainCoursWidget';
import { proprietesWidget } from '@/widgets/proprietesWidget';
import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

/**
 * Point d'entrée du widget, exécuté par Android hors de l'application.
 *
 * Ce gestionnaire tourne dans un contexte JavaScript sans état React : ni
 * contexte, ni navigation, ni données en mémoire. Tout vient du stockage, via
 * proprietesWidget.
 */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
    if (props.widgetInfo.widgetName !== 'ProchainCours') return;

    switch (props.widgetAction) {
        case 'WIDGET_ADDED':
        case 'WIDGET_UPDATE':
        case 'WIDGET_RESIZED':
            props.renderWidget(<ProchainCoursWidget {...proprietesWidget()} />);
            break;

        case 'WIDGET_CLICK':
            // Inatteignable : le clic utilise OPEN_URI, que le receiver natif
            // traite lui-même sans réveiller ce gestionnaire. Le cas reste
            // déclaré pour que l'ajout d'un bouton n'ouvre pas un trou.
            break;

        case 'WIDGET_DELETED':
            break;
    }
}
