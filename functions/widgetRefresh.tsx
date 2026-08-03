import { ProchainCoursWidget } from '@/widgets/ProchainCoursWidget';
import { proprietesWidget } from '@/widgets/proprietesWidget';
import React from 'react';
import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';

/**
 * Demande au système de redessiner le widget.
 *
 * Sans cet appel, le widget ne se rafraîchirait qu'au rythme de son
 * updatePeriodMillis, dont Android impose un plancher de 30 minutes. Ici on le
 * met à jour dès que l'application recharge l'emploi du temps ou change de
 * thème, ce qui couvre le cas le plus fréquent : l'utilisateur ouvre l'app,
 * revient à l'accueil.
 *
 * Isolé dans son propre module pour que les contextes n'importent pas
 * directement la bibliothèque du widget.
 */
export function demanderMiseAJourWidget(): void {
    if (Platform.OS !== 'android') return;

    requestWidgetUpdate({
        widgetName: 'ProchainCours',
        // Évalué au moment du rendu, pas maintenant : le contenu doit refléter
        // l'heure à laquelle Android redessine.
        renderWidget: () => <ProchainCoursWidget {...proprietesWidget()} />,
        // Aucun widget posé sur l'écran d'accueil : ce n'est pas une erreur.
        widgetNotFound: () => { },
    });
}
