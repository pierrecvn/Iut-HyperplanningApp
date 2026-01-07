import React, { useEffect, useRef } from 'react';
import { Modal, StyleSheet, Text, View, Animated, Dimensions, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface TutorialModalProps {
    visible: boolean;
    onClose: () => void;
}

const { width } = Dimensions.get('window');

const TutorialModal = ({ visible, onClose }: TutorialModalProps) => {
    const { theme } = useTheme();
    const handAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            const animation = Animated.loop(
                Animated.sequence([
                    Animated.timing(handAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(handAnim, {
                        toValue: 0,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            );
            animation.start();
            return () => animation.stop();
        }
    }, [visible]);

    const translateX = handAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-30, 30],
    });

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: theme.bg.base }]}>
                    <View style={styles.iconContainer}>
                        <Animated.View style={{ transform: [{ translateX }] }}>
                            <Ionicons name="hand-right-outline" size={64} color={theme.colors.primary} />
                        </Animated.View>
                        <View style={styles.arrowsContainer}>
                            <Ionicons name="arrow-back" size={24} color={theme.text.secondary} />
                            <View style={{ width: 60 }} />
                            <Ionicons name="arrow-forward" size={24} color={theme.text.secondary} />
                        </View>
                    </View>

                    <Text style={[styles.title, { color: theme.text.base }]}>Navigation Facile</Text>
                    <Text style={[styles.description, { color: theme.text.secondary }]}>
                        Glissez vers la gauche ou la droite pour changer de jour ou de semaine rapidement dans votre planning.
                    </Text>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.colors.primary }]}
                        onPress={onClose}
                    >
                        <Text style={styles.buttonText}>J'ai compris !</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: width * 0.85,
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        elevation: 5,
    },
    iconContainer: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    arrowsContainer: {
        flexDirection: 'row',
        position: 'absolute',
        top: 40,
        opacity: 0.5,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        elevation: 2,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default TutorialModal;
