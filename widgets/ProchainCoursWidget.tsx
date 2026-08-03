import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export type ProchainCoursWidgetProps = {
    /** null quand aucun cours n'est à venir dans la fenêtre connue. */
    cours: {
        titre: string;
        horaire: string;
        salle: string;
        enCours: boolean;
    } | null;
};

const FOND = '#1C1B1A';
const ACCENT = '#C77B29';
const VERT_EN_COURS = '#4CAF50';

/**
 * Widget d'écran d'accueil affichant le cours en cours ou le prochain.
 *
 * Rendu en bitmap par react-native-android-widget, pas en vues natives : les
 * hauteurs doivent laisser de la marge, sinon certains lanceurs rognent le
 * contenu. C'est ce qui coupait la ligne de salle lors du premier essai.
 */
export function ProchainCoursWidget({ cours }: ProchainCoursWidgetProps) {
    return (
        <FlexWidget
            style={{
                height: 'match_parent',
                width: 'match_parent',
                justifyContent: 'center',
                alignItems: 'flex-start',
                backgroundColor: FOND,
                borderRadius: 16,
                paddingHorizontal: 14,
                paddingVertical: 12,
            }}
            clickAction="OUVRIR_PLANNING"
        >
            {cours === null ? (
                <FlexWidget style={{ flexDirection: 'column' }}>
                    <TextWidget
                        text="AUCUN COURS"
                        style={{ fontSize: 11, fontWeight: 'bold', color: ACCENT, marginBottom: 4 }}
                    />
                    <TextWidget
                        text="Rien de prévu pour le moment"
                        maxLines={2}
                        style={{ fontSize: 14, color: '#9E9E9E' }}
                    />
                </FlexWidget>
            ) : (
                <FlexWidget style={{ flexDirection: 'column' }}>
                    <TextWidget
                        text={cours.enCours ? 'EN COURS' : 'PROCHAIN COURS'}
                        style={{
                            fontSize: 11,
                            fontWeight: 'bold',
                            color: cours.enCours ? VERT_EN_COURS : ACCENT,
                            marginBottom: 4,
                        }}
                    />
                    <TextWidget
                        text={cours.titre}
                        maxLines={2}
                        style={{ fontSize: 15, fontWeight: 'bold', color: '#FFFFFF' }}
                    />
                    <TextWidget
                        text={cours.horaire}
                        maxLines={1}
                        style={{ fontSize: 13, color: '#E0E0E0', marginTop: 3 }}
                    />
                    <TextWidget
                        text={cours.salle}
                        maxLines={1}
                        style={{ fontSize: 12, color: '#9E9E9E', marginTop: 1 }}
                    />
                </FlexWidget>
            )}
        </FlexWidget>
    );
}
