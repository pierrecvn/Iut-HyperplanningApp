import { useTheme } from '@/context/ThemeContext';
import { useUpdate } from '@/context/UpdateContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, View } from 'react-native';

export const UpdateModal = () => {
    const { theme } = useTheme();
    const { modalVisible, updateStatus, updateDetails } = useUpdate();

    const spinAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (modalVisible) {
            Animated.loop(
                Animated.timing(spinAnim, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();

            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            Animated.timing(progressAnim, {
                toValue: 1,
                duration: 3000,
                easing: Easing.out(Easing.quad),
                useNativeDriver: false,
            }).start();
        } else {
            spinAnim.setValue(0);
            pulseAnim.setValue(1);
            progressAnim.setValue(0);
        }
    }, [modalVisible]);

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const getStatusIcon = () => {
        if (updateStatus.includes('Erreur')) return 'alert-circle';
        if (updateStatus.includes('Aucune')) return 'checkmark-circle';
        if (updateStatus.includes('Téléchargement')) return 'cloud-download';
        if (updateStatus.includes('Rechargement')) return 'refresh-circle';
        return 'sync';
    };

    const getStatusColor = () => {
        if (updateStatus.includes('Erreur')) return '#EF4444';
        if (updateStatus.includes('Aucune')) return '#10B981';
        return theme.colors.primary;
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={modalVisible}
            statusBarTranslucent={true}
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.modalContainer,
                        {
                            backgroundColor: theme.bg.base,
                            transform: [{ scale: pulseAnim }],
                        },
                    ]}
                >
                    <View style={[styles.decorativeCircle, { backgroundColor: getStatusColor() + '15' }]} />

                    <Animated.View
                        style={[
                            styles.iconContainer,
                            {
                                backgroundColor: getStatusColor() + '20',
                                transform: [{ rotate: spin }],
                            },
                        ]}
                    >
                        <Ionicons
                            name={getStatusIcon()}
                            size={40}
                            color={getStatusColor()}
                        />
                    </Animated.View>

                    <Text style={[styles.statusTitle, { color: theme.text.base }]}>
                        {updateStatus}
                    </Text>

                    <View style={[styles.progressBarContainer, { backgroundColor: theme.bg.alarme }]}>
                        <Animated.View
                            style={[
                                styles.progressBar,
                                {
                                    backgroundColor: getStatusColor(),
                                    width: progressAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '90%'],
                                    }),
                                },
                            ]}
                        />
                    </View>

                    {updateDetails ? (
                        <View style={[styles.detailsContainer, { backgroundColor: theme.bg.alarme }]}>
                            <Ionicons
                                name="information-circle-outline"
                                size={18}
                                color={theme.text.secondary}
                                style={styles.detailsIcon}
                            />
                            <Text style={[styles.detailsText, { color: theme.text.secondary }]}>
                                {updateDetails}
                            </Text>
                        </View>
                    ) : null}

                    <View style={styles.dotsContainer}>
                        {[0, 1, 2].map((index) => (
                            <Animated.View
                                key={index}
                                style={[
                                    styles.dot,
                                    {
                                        backgroundColor: getStatusColor(),
                                        opacity: pulseAnim.interpolate({
                                            inputRange: [1, 1.1],
                                            outputRange: [0.3 + index * 0.2, 0.8 - index * 0.1],
                                        }),
                                    },
                                ]}
                            />
                        ))}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalContainer: {
        width: '85%',
        maxWidth: 340,
        borderRadius: 28,
        padding: 32,
        alignItems: 'center',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
    },
    decorativeCircle: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        borderRadius: 75,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 20,
        letterSpacing: 0.3,
    },
    progressBarContainer: {
        width: '100%',
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 20,
    },
    progressBar: {
        height: '100%',
        borderRadius: 3,
    },
    detailsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        width: '100%',
        marginBottom: 16,
    },
    detailsIcon: {
        marginRight: 10,
    },
    detailsText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
});