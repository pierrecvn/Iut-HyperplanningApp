import { SettingsSeparator } from '@/components/parametres/SettingsSection';
import SettingItem from '@/components/SettingItem';
import { useEdt } from '@/context/EdtContext';
import { simulerChangementEdt } from '@/functions/edtDiffDevTools';
import React, { useState } from 'react';
import { Alert } from 'react-native';

type DevToolsProps = {
    /** Groupe dont le cache sera altéré. */
    groupe: string;
};

/**
 * Outils réservés au développement. Ne rend rien en production.
 *
 * Existe parce que le chemin nominal de la détection de changement — une
 * notification effectivement envoyée — ne s'observe pas à la demande : il faut
 * qu'Hyperplanning modifie réellement l'emploi du temps.
 */
export function DevTools({ groupe }: DevToolsProps) {
    const { refreshEdt } = useEdt();
    const [enCours, setEnCours] = useState(false);

    if (!__DEV__) return null;

    const simuler = async () => {
        if (!groupe || groupe === 'merged_view') {
            Alert.alert('Impossible', 'Choisis un groupe précis avant de simuler.');
            return;
        }

        setEnCours(true);
        try {
            const rapport = await simulerChangementEdt(groupe);
            refreshEdt();
            Alert.alert('Simulation', rapport);
        } finally {
            setEnCours(false);
        }
    };

    return (
        <>
            <SettingsSeparator />
            <SettingItem
                icon="bug-outline"
                title="Simuler un changement d'EDT"
                description="Altère le cache local pour déclencher une vraie notification de changement"
                onPress={simuler}
                controlType="button"
                disabled={enCours}
            />
        </>
    );
}
