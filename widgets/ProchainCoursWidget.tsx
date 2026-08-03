import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export type ProchainCoursWidgetProps = {
    titre: string;
    horaire: string;
    salle: string;
};

/**
 * Widget d'écran d'accueil affichant le prochain cours.
 *
 * Rendu en bitmap par react-native-android-widget, pas en vues natives : les
 * dimensions doivent être explicites, et certains lanceurs rognent le résultat
 * si la taille annoncée diffère de la taille réelle.
 */
export function ProchainCoursWidget({ titre, horaire, salle }: ProchainCoursWidgetProps) {
    return (
        <FlexWidget
            style={{
                height: 'match_parent',
                width: 'match_parent',
                justifyContent: 'center',
                alignItems: 'flex-start',
                backgroundColor: '#1C1B1A',
                borderRadius: 16,
                padding: 16,
            }}
            clickAction="OUVRIR_PLANNING"
        >
            <TextWidget
                text="PROCHAIN COURS"
                style={{ fontSize: 11, fontWeight: 'bold', color: '#C77B29', marginBottom: 6 }}
            />
            <TextWidget
                text={titre}
                maxLines={2}
                style={{ fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' }}
            />
            <TextWidget
                text={horaire}
                style={{ fontSize: 14, color: '#E0E0E0', marginTop: 4 }}
            />
            <TextWidget
                text={salle}
                maxLines={1}
                style={{ fontSize: 12, color: '#9E9E9E', marginTop: 2 }}
            />
        </FlexWidget>
    );
}
