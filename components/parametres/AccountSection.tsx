import CustomModal from '@/components/CustomModal';
import { SettingsSeparator } from '@/components/parametres/SettingsSection';
import SettingItem from '@/components/SettingItem';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { removeUserAllData } from '@/functions/supabase';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type AccountSectionProps = {
    modalVisible: boolean;
    onOpenModal: () => void;
    onCloseModal: () => void;
};

/**
 * Zone de danger : déconnexion, suppression du compte, et la modale de
 * confirmation.
 *
 * Aucun état propre — la session vient d'AuthContext, la visibilité de la
 * modale du parent.
 */
export function AccountSection({ modalVisible, onOpenModal, onCloseModal }: AccountSectionProps) {
    const { theme } = useTheme();
    const { user, deconnexion } = useAuth();

    return (
        <>
            <SettingItem
                icon="log-out-outline"
                title="Se déconnecter"
                description="Fermer votre session actuelle"
                value={user ? true : false}
                onValueChange={deconnexion}
                controlType="icon"
                rightIcon={'log-out-outline'}
                customStyle={{ color: theme.colors.danger }}
                onPress={() => { deconnexion() }}
            />

            {user ? (
                <>
                    <SettingsSeparator />
                    <SettingItem
                        icon="trash-outline"
                        title="Supprimer mon compte"
                        description="Cette action est irréversible"
                        value={user ? true : false}
                        onValueChange={onOpenModal}
                        controlType="icon"
                        rightIcon={'alert-circle-outline'}
                        customStyle={{ color: theme.colors.danger }}
                        onPress={onOpenModal}
                    />
                </>
            ) : null}

            <CustomModal
                visible={modalVisible}
                onClose={onCloseModal}
                backgroundColor={theme.bg.base}
                primaryColor="#4CAF50"
                secondaryColor={theme.colors.danger}
                headerTitle="Suppression totale des données"
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
                                name="warning-outline"
                                size={24}
                                color={theme.colors.danger}
                            />
                            <Text style={[
                                styles.settingTitle,
                                {
                                    color: theme.colors.danger,
                                    marginLeft: 10
                                }
                            ]}>
                                Suppression totale des données
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
                                <Text>Êtes-vous sûr de vouloir supprimer toutes vos données ?</Text>
                            </Text>
                            <SettingsSeparator />

                            <TouchableOpacity
                                style={{
                                    backgroundColor: theme.colors.danger,
                                    padding: 15,
                                    borderRadius: 10,
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                onPress={async () => {
                                    await removeUserAllData();
                                    deconnexion();
                                    onCloseModal();
                                }}
                            >
                                <Text style={{
                                    color: theme.text.base,
                                    fontWeight: 'bold'
                                }}>
                                    Supprimer
                                </Text>
                            </TouchableOpacity>
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
