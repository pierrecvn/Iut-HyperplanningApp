import CustomModal from '@/components/CustomModal';
import SettingItem from '@/components/SettingItem';
import { useTheme } from '@/context/ThemeContext';
import { coursAExporter } from '@/functions/coursAExporter';
import { exporterVersAgenda, PermissionAgendaRefusee } from '@/functions/exportAgenda';
import type { ICalEvent } from '@/interfaces/IcalEvent';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from 'react-native-ui-datepicker';

type AgendaExportProps = {
    /**
     * Les cours du groupe par défaut, jamais ceux d'une preview : l'export
     * écrit dans l'agenda personnel de l'utilisateur, il ne doit pas y déverser
     * l'emploi du temps d'un groupe qu'il ne fait que consulter.
     */
    events: ICalEvent[];
};

/**
 * Export de l'emploi du temps vers l'agenda de l'appareil.
 *
 * La période est demandée avant d'écrire quoi que ce soit. Exporter l'année
 * entière par défaut aurait rempli l'agenda de centaines d'événements pour
 * quelqu'un qui voulait voir sa semaine.
 */
export function AgendaExport({ events }: AgendaExportProps) {
    const { theme } = useTheme();

    const [visible, setVisible] = useState(false);
    const [enCours, setEnCours] = useState(false);
    const [debut, setDebut] = useState<Date>(dayjs().startOf('day').toDate());
    const [fin, setFin] = useState<Date>(dayjs().add(1, 'month').endOf('day').toDate());

    const periodeLisible = `${dayjs(debut).format('D MMM')} → ${dayjs(fin).format('D MMM YYYY')}`;

    // Même fonction que l'export lui-même : le nombre annoncé ne peut pas
    // diverger de ce qui sera réellement écrit.
    const nombreConcerne = coursAExporter(events, debut, fin).length;

    const lancerExport = async () => {
        setEnCours(true);
        try {
            const { ecrits, remplaces } = await exporterVersAgenda(events, debut, fin);

            setVisible(false);
            Alert.alert(
                'Export terminé',
                ecrits === 0
                    ? `Aucun cours sur ${periodeLisible}. Rien n'a été ajouté à votre agenda.`
                    : `${ecrits} cours écrits dans le calendrier « IUT — Mon planning ».` +
                    (remplaces > 0 ? `\n\n${remplaces} anciens cours de cette période ont été remplacés.` : '')
            );
        } catch (error) {
            if (error instanceof PermissionAgendaRefusee) {
                Alert.alert(
                    'Accès refusé',
                    "L'application a besoin de l'accès à l'agenda pour y écrire vos cours. Vous pouvez l'autoriser dans les paramètres Android de l'application."
                );
            } else {
                console.error('Export agenda impossible', error);
                Alert.alert('Export impossible', (error as Error).message);
            }
        } finally {
            setEnCours(false);
        }
    };

    return (
        <>
            <SettingItem
                icon="cloud-upload-outline"
                title="Exporter vers mon agenda"
                description="Écrire mes cours dans le calendrier du téléphone"
                onPress={() => setVisible(true)}
                controlType="button"
            />

            <CustomModal
                visible={visible}
                onClose={() => setVisible(false)}
                backgroundColor={theme.bg.base}
                primaryColor={theme.colors.primary}
                secondaryColor={theme.colors.secondary}
                headerTitle="Exporter vers mon agenda"
                renderContent={() => (
                    <View>
                        <Text style={{ color: theme.text.secondary, marginBottom: 12, fontSize: 13 }}>
                            Les cours de la période choisie seront écrits dans un calendrier
                            « IUT — Mon planning », créé sur l&apos;appareil. Ré-exporter la même
                            période met les cours à jour au lieu de les dupliquer.
                        </Text>

                        <DateTimePicker
                            mode="range"
                            startDate={debut}
                            endDate={fin}
                            onChange={(params: any) => {
                                if (params.startDate) setDebut(dayjs(params.startDate).startOf('day').toDate());
                                if (params.endDate) setFin(dayjs(params.endDate).endOf('day').toDate());
                            }}
                            locale="fr"
                            selectedItemColor={theme.colors.primary}
                            headerTextStyle={{ color: theme.colors.secondary }}
                            headerButtonColor={theme.colors.primary}
                            weekDaysTextStyle={{ color: theme.text.base }}
                            calendarTextStyle={{ color: theme.text.base }}
                            yearContainerStyle={{ backgroundColor: theme.bg.base }}
                            monthContainerStyle={{ backgroundColor: theme.bg.base }}
                        />

                        <Text style={{ color: theme.text.base, textAlign: 'center', marginTop: 8, fontWeight: '600' }}>
                            {periodeLisible}
                        </Text>
                        <Text style={{ color: theme.text.secondary, textAlign: 'center', marginTop: 2, fontSize: 13 }}>
                            {nombreConcerne} cours concernés
                        </Text>

                        <TouchableOpacity
                            style={{
                                backgroundColor: theme.colors.primary,
                                padding: 15,
                                borderRadius: 10,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: 15,
                                opacity: enCours ? 0.6 : 1,
                            }}
                            onPress={lancerExport}
                            disabled={enCours}
                        >
                            {enCours
                                ? <ActivityIndicator color="#FFF" />
                                : <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Exporter</Text>}
                        </TouchableOpacity>
                    </View>
                )}
            />
        </>
    );
}
