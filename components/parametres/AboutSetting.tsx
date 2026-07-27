import CustomModal from '@/components/CustomModal';
import { SettingsSeparator } from '@/components/parametres/SettingsSection';
import SettingItem from '@/components/SettingItem';
import { useTheme } from '@/context/ThemeContext';
import packageJson from '@/package.json';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type AboutSettingProps = {
    modalVisible: boolean;
    onOpenModal: () => void;
    onCloseModal: () => void;
};

/**
 * L'entrée « À propos » et sa modale de détails.
 *
 * Possède l'état `griette` : un easter egg déclenché par un appui long sur
 * le nom du designer.
 */
export function AboutSetting({ modalVisible, onOpenModal, onCloseModal }: AboutSettingProps) {
    const { theme } = useTheme();
    const [griette, setGriette] = useState(false);

    return (
        <>
            <SettingItem
                icon="information-circle-outline"
                title="À propos"
                description={`Version ${packageJson.version}`}
                controlType="icon"
                rightIcon="chevron-forward"
                onPress={onOpenModal}
            />

            <CustomModal
                visible={modalVisible}
                onClose={onCloseModal}
                backgroundColor={theme.bg.base}
                primaryColor={theme.colors.primary}
                secondaryColor={theme.colors.secondary}
                headerTitle="Informations sur l'application"
                renderContent={() => (
                    <View style={{
                        padding: 15,
                        backgroundColor: theme.bg.alarme,
                        borderRadius: 12
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 15
                        }}>
                            <Ionicons
                                name="information-circle-outline"
                                size={24}
                                color={theme.colors.primary}
                            />
                            <Text style={[
                                styles.settingTitle,
                                {
                                    color: theme.text.base,
                                    marginLeft: 10
                                }
                            ]}>
                                Détails de l&apos;Application
                            </Text>
                        </View>

                        <View style={{
                            backgroundColor: theme.bg.base,
                            borderRadius: 10,
                            padding: 15
                        }}>
                            <Text style={[
                                styles.settingDescription,
                                {
                                    color: theme.text.secondary,
                                    marginBottom: 8
                                }
                            ]}>
                                <Text>Nom - </Text>
                                <Text style={{ fontWeight: '900' }}>{packageJson.name}</Text>
                            </Text>
                            <SettingsSeparator />
                            <Text style={[
                                styles.settingDescription,
                                {
                                    color: theme.text.secondary,
                                    marginBottom: 8
                                }
                            ]}>
                                <Text>Version - </Text>
                                <Text style={{ fontWeight: '900' }}>{packageJson.version}</Text>
                            </Text>
                            <SettingsSeparator />


                            <Text style={[
                                styles.settingDescription,
                                {
                                    color: theme.text.secondary,
                                    marginBottom: 8
                                }
                            ]}>
                                <Text>Design - </Text>
                                <Text onLongPress={() => { setGriette(true) }} style={[{ fontWeight: '900', fontSize: 14, color: theme.text.secondary }]} >Cazo Joey </Text>
                                <Text style={[{ fontWeight: '900', fontSize: 14 }]}>
                                    && Cauvin Pierre
                                </Text>
                                {griette ? '\nEncore un projet où griette a servi à rien' : null}

                            </Text>

                            <SettingsSeparator />
                            <Text style={[
                                styles.settingDescription,
                                {
                                    color: theme.text.secondary
                                }
                            ]}>
                                <Text>Développement - </Text>
                                <Text style={{ fontWeight: 'bold' }}>Cauvin Pierre </Text>
                            </Text>

                        </View>
                    </View>
                )}
            />
        </>
    );
}

const styles = StyleSheet.create({
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 2,
    },
    settingDescription: {
        fontSize: 13,
        opacity: 0.7,
    },
});
