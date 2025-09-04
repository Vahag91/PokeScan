import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import PhotoManipulator from 'react-native-photo-manipulator';
import { useTranslation } from 'react-i18next';
import ScanButton from './ScanButton';
import CardPreview from './CardPreview';
import CardCarouselPreview from './CardCarouselPreview';
import CameraView from './CameraView';
import ScannerHeader from './ScannerHeader';
import ScanStatusPill from './ScanStatusPill';

import Ionicons from 'react-native-vector-icons/Ionicons';
import { fetchScannerCardFromSupabaseJPStrict, matchCardENStrict } from '../../../supabase/utils';
import { supabase } from '../../../supabase/supabase';
import RNFS from 'react-native-fs';
import { hasExceededLimit, incrementScanCount, getRemainingFreeAttempts } from '../../utils';
import PaywallModal from '../../screens/PaywallScreen';
import { SubscriptionContext } from '../../context/SubscriptionContext';
import RateUsService from '../../services/RateUsService';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const UI_STAGES = {
  SCANNING: 'scanning',
  SEARCHING: 'searching',
  IDLE: 'idle',
};

export default function ScannerScreen({ navigation }) {
  const { t } = useTranslation();
  const [permissionStatus, setPermissionStatus] = useState('not-determined');
  const [loading, setLoading] = useState(false);
  const [overlayLayout, setOverlayLayout] = useState(null);
  const [cardName, setCardName] = useState(null);
  const [cardData, setCardData] = useState(null);
  const [cardResults, setCardResults] = useState([]);
  const [noResult, setNoResult] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [scanLanguage, setScanLanguage] = useState('jp'); // 'en' or 'jp'
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(3);

  const [scanStage, setScanStage] = useState(UI_STAGES.IDLE);
  const [capturedImage, setCapturedImage] = useState(null);

  useEffect(() => {
    clearScanResult();
  }, [scanLanguage]);

  useEffect(() => {
    const loadRemainingAttempts = async () => {
      try {
        const attempts = await getRemainingFreeAttempts();
        setRemainingAttempts(attempts);
      } catch (error) {
        console.warn('Failed to load remaining attempts:', error);
      }
    };
    loadRemainingAttempts();
  }, []);

  const { isPremium } = useContext(SubscriptionContext);
  const device = useCameraDevice('back');
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const status = await Camera.getCameraPermissionStatus();
      if (status === 'authorized') {
        setPermissionStatus('authorized');
      } else {
        const newStatus = await Camera.requestCameraPermission();
        if (newStatus === 'denied') {
                      Alert.alert(
              t('scanner.cameraAccessNeeded'),
              t('scanner.cameraAccessNeededMessage'),
              [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('scanner.openSettings'), onPress: () => Linking.openSettings() },
              ],
            );
        }
        setPermissionStatus(newStatus);
      }
    })();
  }, [t]);

  const onScan = async () => {
    if (!overlayLayout) return;
    if (loading) return;

    if (!isPremium) {
      try {
        const exceeded = await hasExceededLimit();
        if (exceeded) {
          setShowPaywall(true);
          return;
        }
      } catch (error) {
        console.warn('Failed to check scan limit:', error);
      }
    }

    try {
      setLoading(true);
      setScanStage(UI_STAGES.SCANNING);

      setCardName(null);
      setCardData(null);
      setCardResults([]);
      setNoResult(false);

      // 1) Capture
      const photo = await cameraRef.current.takePhoto();

      // 2) Prepare crop
      const uri = photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`;
      setCapturedImage(uri); // show as freeze/blur overlay

      const scaleX = (photo.width / SCREEN_WIDTH) * 0.8;
      const scaleY = photo.height / SCREEN_HEIGHT;

      const box = {
        x: Math.max(0, Math.round(overlayLayout.x * scaleX * 0.4)),
        y: Math.max(0, -Math.round(overlayLayout.y * scaleY * 0.8) + 900),
        width: Math.round(overlayLayout.width * scaleX * 0.85),
        height: Math.round(overlayLayout.height * scaleY * 1.7 + 100),
      };

      const targetWidth = 700;
      const aspectRatio = box.height / box.width;
      const targetHeight = Math.round(targetWidth * aspectRatio);

      // 3) Crop
      const croppedPath = await PhotoManipulator.crop(
        uri,
        box,
        { width: targetWidth, height: targetHeight },
        'image/jpeg',
      );

      // 4) Build payload
      const fileExt = croppedPath.split('.').pop();
      const fileName = `scan-${Date.now()}.${fileExt}`;
      const fileData = await RNFS.readFile(croppedPath, 'base64');
      const bodyPayload = { fileName, base64Image: fileData };

      // 5) Call function + match
      const { data: dataFromEdge, error } = await supabase.functions.invoke(
        scanLanguage === 'en' ? 'classify-card' : 'clever-api',
        { body: bodyPayload },
      );
      if (error) {
        console.error('[SCAN] classify-card error:', error);
        throw error;
      }

      setCardName(dataFromEdge.name);
      setScanStage(UI_STAGES.SEARCHING);

      let matches = null;
      if (scanLanguage === 'jp') {
        matches = await fetchScannerCardFromSupabaseJPStrict(
          dataFromEdge.name,
          dataFromEdge.number,
          dataFromEdge.hp,
          dataFromEdge.illustrator,
        );
      } else {
        matches = await matchCardENStrict({
          name: dataFromEdge.name,
          number: dataFromEdge.number,
          hp: dataFromEdge.hp,
          illustrator: dataFromEdge.illustrator,
        });
      }

      if (matches?.length === 1) {
        setCardData(matches[0]);
        setCardResults([]);
        setNoResult(false);
        setCapturedImage(null); // Clear freeze overlay after successful scan
        
        if (!isPremium) {
          try {
            await incrementScanCount();
            const attempts = await getRemainingFreeAttempts();
            setRemainingAttempts(attempts);
          } catch (error) {
            console.warn('Failed to increment scan count:', error);
          }
        }
        
        // Show native rating dialog after successful scan (production behavior)
        setTimeout(async () => {
          const shouldShow = await RateUsService.shouldShowRatePrompt();
          if (shouldShow) {
            await RateUsService.showRatePrompt();
          }
        }, 2000); // 2 second delay after successful scan
      } else if (matches?.length > 1) {
        setCardData(null);
        setCardResults(matches);
        setNoResult(false);
        setCapturedImage(null); // Clear freeze overlay after successful scan
        
        if (!isPremium) {
          try {
            await incrementScanCount();
            const attempts = await getRemainingFreeAttempts();
            setRemainingAttempts(attempts);
          } catch (error) {
            console.warn('Failed to increment scan count:', error);
          }
        }
        
        // Show native rating dialog after successful scan with multiple results (production behavior)
        setTimeout(async () => {
          const shouldShow = await RateUsService.shouldShowRatePrompt();
          if (shouldShow) {
            await RateUsService.showRatePrompt();
          }
        }, 2000); // 2 second delay after successful scan
      } else {
        setCardData(null);
        setCardResults([]);
        setNoResult(true);
        setCapturedImage(null); // Clear freeze overlay after scan attempt
      }
    } catch (e) {
      setCardName('Error');
      setNoResult(true);
      setCapturedImage(null); // Clear freeze overlay on error
    } finally {
      setLoading(false);
      setScanStage(UI_STAGES.IDLE);
    }
  };

  const clearScanResult = () => {
    setCardName(null);
    setCardData(null);
    setCardResults([]);
    setNoResult(false);
    setCapturedImage(null);
  };

  if (permissionStatus === 'not-determined' || device == null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading camera…</Text>
      </View>
    );
  }

  if (permissionStatus === 'denied') {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="camera-outline" size={64} color="#10B981" style={{ marginBottom: 16 }} />
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionSubtitle}>
          Please enable camera access in your device settings to scan Pokémon
          cards.
        </Text>
        <View style={styles.permissionButtons}>
          <TouchableOpacity
            style={styles.openSettingsBtn}
            onPress={() => Linking.openSettings()}
          >
            <Text style={styles.openSettingsText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        cameraRef={cameraRef}
        device={device}
        onOverlayLayout={setOverlayLayout}
        stage={scanStage}
        // 👉 NEW: freeze/blur overlay
        freezeUri={capturedImage}
        shouldFreeze={scanStage !== UI_STAGES.IDLE && !!capturedImage}
      />

      <ScannerHeader
        navigation={navigation}
        scanLanguage={scanLanguage}
        setScanLanguage={setScanLanguage}
        showLanguageDropdown={showLanguageDropdown}
        setShowLanguageDropdown={setShowLanguageDropdown}
      />

      <ScanStatusPill stage={scanStage} capturedImage={capturedImage} />

      {!isPremium && (
        <View style={styles.freeAttemptsContainer}>
          <Text style={styles.freeAttemptsText}>
          {remainingAttempts} {t('scanner.freeScansLeft')}
          </Text>
        </View>
      )}

      <View style={styles.overlay}>
        <ScrollView
          contentContainerStyle={styles.scrollArea}
          showsVerticalScrollIndicator={false}
        >
          {cardData ? (
            <CardPreview cardName={cardName} cardData={cardData} language={scanLanguage} />
          ) : cardResults.length > 0 ? (
            <CardCarouselPreview cards={cardResults} language={scanLanguage} />
          ) : noResult ? (
            <View style={styles.noResultWrapper}>
              <Text style={styles.noResultTitle}>{t('scanner.noCardsFound')}</Text>
              <Text style={styles.noResultDescription}>
                {t('scanner.noMatchFound')}
              </Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.scanSection}>
          <ScanButton loading={loading} onPress={onScan} />
          {!loading && (
            <Text style={styles.tapToScanText}>
              {scanStage === UI_STAGES.IDLE
                ? t('scanner.scanHint')
                : scanStage === UI_STAGES.SCANNING
                ? t('scanner.scanning')
                : t('scanner.searching')}
            </Text>
          )}
        </View>

        {(cardData || cardResults.length > 0) && (
          <TouchableOpacity
            onPress={clearScanResult}
            style={styles.clearFloatingButton}
            activeOpacity={0.85}
          >
            <Ionicons
              name="close-circle-outline"
              size={16}
              color="#fff"
              style={styles.clearIcon}
            />
            <Text style={styles.clearFloatingText}>{t('scanner.clear')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, color: '#888' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: {
    position: 'absolute',
    bottom: 44,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  scrollArea: { paddingBottom: 2, alignItems: 'center' },
  scanSection: { marginTop: 8, alignItems: 'center', gap: 6 },
  tapToScanText: { color: '#E5E7EB', fontSize: 14, opacity: 0.9, marginTop: 4, fontFamily: 'Lato-Bold' },

  freeAttemptsContainer: {
    position: 'absolute',
    top: 140,
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  freeAttemptsText: {
    color: '#E5E7EB',
    fontSize: 11,
    fontFamily: 'Lato-Regular',
    opacity: 0.8,
    letterSpacing: 0.5,
  },

  clearFloatingButton: {
    position: 'absolute',
    left: 30,
    bottom: 58,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#df1f28ff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  clearFloatingText: { color: '#fff', fontSize: 13, fontWeight: '600', marginLeft: 6 },
  clearIcon: { marginTop: 1 },

  noResultWrapper: { alignItems: 'center', paddingHorizontal: 24 },
  noResultTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Lato-Bold', color: '#F1F5F9', marginBottom: 4, textAlign: 'center' },
  noResultDescription: { fontSize: 14, fontFamily: 'Lato-Bold', color: '#9CA3AF', textAlign: 'center', marginBottom: 8, lineHeight: 20 },

  permissionTitle: { fontSize: 20, fontWeight: '700', color: '#F1F5F9', marginBottom: 8, textAlign: 'center', fontFamily: 'Lato-Bold' },
  permissionSubtitle: { fontSize: 14, color: '#94A3B8', textAlign: 'center', paddingHorizontal: 32, lineHeight: 20, marginBottom: 20, fontFamily: 'Lato-Regular' },
  permissionButtons: { flexDirection: 'row', gap: 12 },
  openSettingsBtn: { backgroundColor: '#10B981', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 24 },
  openSettingsText: { color: '#fff', fontWeight: '600', fontSize: 14, fontFamily: 'Lato-Bold' },
});
