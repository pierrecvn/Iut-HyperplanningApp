import type { ContenuCours } from '@/widgets/contenuCours';
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export type ProchainCoursWidgetProps = {
    /** null quand aucun cours n'est à venir dans la fenêtre connue. */
    cours: ContenuCours | null;
    /** Lien profond ouvert au clic, construit par functions/lienProfond. */
    lien: string;
    /** Palette à utiliser ; suit le thème de l'application. */
    sombre: boolean;
};

/**
 * Deux palettes figées plutôt que les couleurs du thème actif.
 *
 * Le widget est posé sur un fond d'écran inconnu, dans une vignette de
 * 180×110dp : les accents des thèmes fantaisie de l'application n'y tiennent
 * pas le contraste. Chaque couleur ci-dessous passe au moins 4,5:1 sur son
 * propre fond.
 */
const PALETTES = {
    sombre: {
        fond: '#1C1B1A',
        accent: '#C77B29',
        enCours: '#4CAF50',
        titre: '#FFFFFF',
        horaire: '#E0E0E0',
        salle: '#9E9E9E',
    },
    clair: {
        fond: '#FFFFFF',
        accent: '#975000',
        enCours: '#2E7D32',
        titre: '#171717',
        horaire: '#3F3F3F',
        salle: '#6E6E6E',
    },
} as const;

/**
 * Widget d'écran d'accueil affichant le cours en cours ou le prochain.
 *
 * Rendu en bitmap par react-native-android-widget, pas en vues natives : les
 * hauteurs doivent laisser de la marge, sinon certains lanceurs rognent le
 * contenu. C'est ce qui coupait la ligne de salle lors du premier essai.
 *
 * Le clic passe par `OPEN_URI`, traité par le receiver natif de la
 * bibliothèque. Un nom d'action quelconque ne ferait qu'appeler le
 * gestionnaire JavaScript, qui n'a aucun moyen d'ouvrir l'application.
 */
export function ProchainCoursWidget({ cours, lien, sombre }: ProchainCoursWidgetProps) {
    const p = sombre ? PALETTES.sombre : PALETTES.clair;

    return (
        <FlexWidget
            style={{
                height: 'match_parent',
                width: 'match_parent',
                justifyContent: 'center',
                alignItems: 'flex-start',
                backgroundColor: p.fond,
                borderRadius: 16,
                paddingHorizontal: 14,
                paddingVertical: 12,
            }}
            clickAction="OPEN_URI"
            clickActionData={{ uri: lien }}
        >
            {cours === null ? (
                <FlexWidget style={{ flexDirection: 'column' }}>
                    <TextWidget
                        text="AUCUN COURS"
                        style={{ fontSize: 11, fontWeight: 'bold', color: p.accent, marginBottom: 4 }}
                    />
                    <TextWidget
                        text="Rien de prévu pour le moment"
                        maxLines={2}
                        style={{ fontSize: 14, color: p.salle }}
                    />
                </FlexWidget>
            ) : (
                <FlexWidget style={{ flexDirection: 'column' }}>
                    <TextWidget
                        text={cours.enCours ? 'EN COURS' : 'PROCHAIN COURS'}
                        style={{
                            fontSize: 11,
                            fontWeight: 'bold',
                            color: cours.enCours ? p.enCours : p.accent,
                            marginBottom: 4,
                        }}
                    />
                    <TextWidget
                        text={cours.titre}
                        maxLines={2}
                        style={{ fontSize: 15, fontWeight: 'bold', color: p.titre }}
                    />
                    <TextWidget
                        text={cours.horaire}
                        maxLines={1}
                        style={{ fontSize: 13, color: p.horaire, marginTop: 3 }}
                    />
                    <TextWidget
                        text={cours.salle}
                        maxLines={1}
                        style={{ fontSize: 12, color: p.salle, marginTop: 1 }}
                    />
                </FlexWidget>
            )}
        </FlexWidget>
    );
}
