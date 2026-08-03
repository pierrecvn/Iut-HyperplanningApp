import { ProchainCoursWidget } from '@/widgets/ProchainCoursWidget';
import { prochainCoursDepuisFenetre } from '@/functions/widgetStore';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import React from 'react';
import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';

dayjs.locale('fr');

/**
 * Demande au système de redessiner le widget.
 *
 * Sans cet appel, le widget ne se rafraîchirait qu'au rythme de son
 * updatePeriodMillis, dont Android impose un plancher de 30 minutes. Ici on le
 * met à jour dès que l'application recharge l'emploi du temps, ce qui couvre le
 * cas le plus fréquent : l'utilisateur ouvre l'app, revient à l'accueil.
 *
 * Isolé dans son propre module pour que EdtContext n'importe pas directement la
 * bibliothèque du widget.
 */
export function demanderMiseAJourWidget(): void {
    if (Platform.OS !== 'android') return;

    const cours = prochainCoursDepuisFenetre();

    const contenu = cours
        ? {
            titre: cours.summary,
            horaire: `${dayjs(cours.start).format('ddd D MMM')} · ${dayjs(cours.start).format('HH:mm')} - ${dayjs(cours.end).format('HH:mm')}`,
            salle: cours.location || 'Salle non précisée',
            enCours: dayjs(cours.start).isBefore(dayjs()) && dayjs(cours.end).isAfter(dayjs()),
        }
        : null;

    requestWidgetUpdate({
        widgetName: 'ProchainCours',
        renderWidget: () => <ProchainCoursWidget cours={contenu} />,
        // Aucun widget posé sur l'écran d'accueil : ce n'est pas une erreur.
        widgetNotFound: () => { },
    });
}
