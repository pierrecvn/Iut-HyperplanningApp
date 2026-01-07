import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import React, { useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Icon from '@/assets/images/login.svg';
import CasLoginModal from "@/components/CasLoginModal";
import RoundBtn from "@/components/RoundBtn";

export default function Index() {
    const { theme } = useTheme();
    const { connexion, connexionUniversitaire } = useAuth();
    const insets = useSafeAreaInsets();
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

    const [casModalVisible, setCasModalVisible] = useState(false);

    const handleCasSuccess = async (url: string) => {
        await connexionUniversitaire(url);
    };

    const styles = StyleSheet.create({
        outerContainer: {
            flex: 1,
            backgroundColor: 'transparent',
        },
        gradient: {
            position: 'absolute',
            width: '100%',
            height: '100%',
            left: 0,
            top: 0,
        },
        container: {
            flex: 1,
        },
        content: {
            flex: 1,
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: insets.top,
        },
        iconContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
        },
        modal: {
            backgroundColor: theme.bg.base,
            minHeight: screenHeight * 0.5,
            width: '100%',
            padding: 20,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            justifyContent: 'space-around',
            alignItems: 'center',
            paddingBottom: Math.max(20, insets.bottom + 10),
            shadowColor: '#FFA845',
            shadowOffset: {
                width: 0,
                height: -10,
            },
            shadowOpacity: 0.5,
            shadowRadius: 24,
            elevation: 24,
        },
        title: {
            fontSize: Math.min(45, screenWidth * 0.08),
            fontFamily: "Inter",
            fontWeight: 'bold',
            color: theme.text.base,
            textAlign: 'center',
            paddingHorizontal: 10,
        },
        label: {
            fontSize: Math.min(16, screenWidth * 0.04),
            color: theme.text.base,
            textAlign: 'center',
            fontFamily: "Inter-Regular",
            paddingHorizontal: 10,
        },
        minilabel: {
            fontSize: Math.min(9, screenWidth * 0.04),
            color: theme.colors.danger,
            textAlign: 'center',
            fontFamily: "Inter-Regular",
            paddingHorizontal: 10,
        }
    });

    return (
        <View style={styles.outerContainer}>
            <LinearGradient
                colors={['#FFA845', '#FFDDB6', '#FFA845']}
                start={{ x: 0.7, y: 0.7 }}
                end={{ x: 0.7, y: 0 }}
                style={styles.gradient}
            />

            <View style={styles.container}>
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Icon width={Math.min(250, screenWidth * 0.6)} height={Math.min(250, screenWidth * 0.6)} />
                    </View>

                    <View style={styles.modal}>
                        <Text style={styles.title}>
                            Bienvenue sur l'appli HyperPlanning
                        </Text>

                        <View style={{ gap: 20 }}>
                            <Text style={styles.label}>
                                Connectez-vous avec discord pour afficher votre emploi du temps en temps réel
                            </Text>

                            <RoundBtn
                                hasIcon={false}
                                icon="logo-discord"
                                text="Connexion avec Discord"
                                onPress={connexion}
                            />

                            <RoundBtn
                                hasIcon={false}
                                icon="school" // Icone générique ou spécifique
                                text="Connexion avec l'Université"
                                onPress={() => setCasModalVisible(true)}
                            />

                            <Text style={styles.minilabel}>
                                Toutes informations stockées pourront être supprimées à tout moment dans les paramètres de l'application,
                                aucunes informations ne seront partagées à des tiers.
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            <CasLoginModal
                visible={casModalVisible}
                onClose={() => setCasModalVisible(false)}
                onSuccess={handleCasSuccess}
                theme={theme}
            />
        </View>
    );
}
