import React, { useState } from 'react';
import { Modal, StyleSheet, SafeAreaView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

interface CasLoginModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: (icalUrl: string) => void;
    theme: any;
}

export default function CasLoginModal({ visible, onClose, onSuccess, theme }: CasLoginModalProps) {
    const SERVICE_URL = "https://hplanning.univ-lehavre.fr/";
    const CAS_URL = `https://cas.univ-lehavre.fr/cas/login?service=${encodeURIComponent(SERVICE_URL)}`;
    
    // Script Scan Desktop Ultra
    const INJECTED_JAVASCRIPT = `
    (function() {
        function debugLog(msg) {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOG', message: msg }));
            }
        }

        var clickCount = 0;

        function check() {
            var html = document.documentElement.outerHTML;
            
            // 1. Recherche large dans tout le HTML (pour attraper les popups chargées)
            var match = html.match(/Telechargements\\/ical\\/.*?\\.ics[^"']*/);
            
            if (match) {
                var relativePath = match[0].replace(/&amp;/g, '&');
                var absoluteUrl = relativePath.startsWith('http') 
                    ? relativePath 
                    : 'https://hplanning.univ-lehavre.fr/' + relativePath;

                debugLog('LIEN DÉTECTÉ: ' + absoluteUrl);
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SUCCESS', url: absoluteUrl }));
                return;
            }

            // 2. Si pas trouvé, on gère le clic
            // On ne clique que toutes les 3 itérations (toutes les 4.5s) pour laisser le temps à la popup
            if (clickCount % 3 === 0) {
                // On cible par l'ID précis que vous avez trouvé ou la classe
                var icalBtn = document.getElementById('GInterface.Instances[0].Instances[4]_ical') || document.querySelector('.icon_ical');
                
                if (icalBtn) {
                     debugLog('Clic FORCE sur l\\'icône iCal... (Tentative ' + (clickCount/3 + 1) + ')');
                     
                     // Simulation complète d'un clic humain
                     ['mousedown', 'mouseup', 'click'].forEach(function(eventType) {
                        var event = new MouseEvent(eventType, {
                            view: window,
                            bubbles: true,
                            cancelable: true
                        });
                        icalBtn.dispatchEvent(event);
                     });
                }
            }
            clickCount++;
        }
        
        debugLog('Scan Desktop (Ultra) démarré...');
        setInterval(check, 1500);
    })();
    true;
    `;

    const DESKTOP_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    const handleMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            
            if (data.type === 'LOG') {
                console.log(`[WebView] ${data.message}`);
            } else if (data.type === 'HTML_DUMP') {
                // On affiche le HTML brute dans la console
                console.log(data.content); 
            } else if (data.type === 'SUCCESS' && data.url) {
                console.log('URL ICAL RÉCUPÉRÉE:', data.url);
                onSuccess(data.url);
                onClose();
            }
        } catch (e) {
            // Ignorer
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={[styles.container, { backgroundColor: theme.bg.base }]}>
                <View style={[styles.header, { backgroundColor: theme.bg.alarme, borderBottomColor: theme.colors.secondary }]}>
                    <Text style={[styles.title, { color: theme.text.base }]}>Connexion Université</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color={theme.colors.danger} />
                    </TouchableOpacity>
                </View>

                <View style={styles.webviewContainer}>
                    <WebView
                        source={{ uri: CAS_URL }}
                        injectedJavaScript={INJECTED_JAVASCRIPT}
                        onMessage={handleMessage}
                        userAgent={DESKTOP_USER_AGENT}
                        startInLoadingState={true}
                        
                        // Debug logs natifs
                        onLoadStart={(e) => console.log(`[Native] Chargement débuté: ${e.nativeEvent.url}`)}
                        onLoadEnd={(e) => console.log(`[Native] Chargement terminé: ${e.nativeEvent.url}`)}
                        onError={(e) => console.error(`[Native] Erreur WebView: ${e.nativeEvent.description}`)}
                        
                        // Suivre la navigation
                        onNavigationStateChange={(navState) => {
                            console.log(`[Nav] ${navState.url} (Loading: ${navState.loading})`);
                        }}

                        renderLoading={() => (
                            <View style={[styles.loading, { backgroundColor: theme.bg.base }]}>
                                <ActivityIndicator size="large" color={theme.colors.primary} />
                                <Text style={{ color: theme.text.secondary, marginTop: 10 }}>Chargement...</Text>
                            </View>
                        )}
                        incognito={true} 
                    />
                </View>
                
                <View style={[styles.footer, { backgroundColor: theme.bg.alarme }]}>
                    <Text style={{ color: theme.text.secondary, fontSize: 12, textAlign: 'center' }}>
                        Connectez-vous. L'application scanne la page pour trouver votre lien unique.
                        Regardez les logs terminaux pour le suivi.
                    </Text>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 5,
    },
    webviewContainer: {
        flex: 1,
        position: 'relative',
    },
    loading: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    footer: {
        padding: 15,
        paddingBottom: 30, 
    }
});