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
import ScanButton from './ScanButton';
import CardPreview from './CardPreview';
import CardCarouselPreview from './CardCarouselPreview';
import CameraView from './CameraView';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { fetchScannerCardFromSupabaseJPStrict,fetchScannerCardFromSupabase,matchCardENStrict } from '../../../supabase/utils';
import { supabase } from '../../../supabase/supabase';
import RNFS from 'react-native-fs';
import { hasExceededLimit, incrementScanCount } from '../../utils';
import PaywallModal from '../../screens/PaywallScreen';
import { SubscriptionContext } from '../../context/SubscriptionContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function ScannerScreen({ navigation }) {
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

  // Clear scan results when language changes
  useEffect(() => {
    clearScanResult();
  }, [scanLanguage]);

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
            'Camera Access Needed',
            'Please allow camera access in Settings to scan Pokémon cards.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ],
          );
        }
        setPermissionStatus(newStatus);
      }
    })();
  }, []);

  const onScan = async () => {
    if (!overlayLayout) return;
    if (loading) return;




    // if (!isPremium) {
    //   const exceeded = await hasExceededLimit();
    //   if (exceeded) {
    //     setShowPaywall(true);
    //     return;
    //   } else {
    //     await incrementScanCount();
    //   }
    // }
    
    try {
      setLoading(true);
      setCardName(null);
      setCardData(null);
      setCardResults([]);
      setNoResult(false);

      // Step 1: Take photo
      const photo = await cameraRef.current.takePhoto();

      // Step 2: Process image path
      const pathStartTime = Date.now();
      const uri = photo.path.startsWith('file://')
        ? photo.path
        : `file://${photo.path}`;

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
      const pathTime = Date.now() - pathStartTime;

      // Step 3: Crop image
      const cropStartTime = Date.now();
      const croppedPath = await PhotoManipulator.crop(
        uri,
        box,
        { width: targetWidth, height: targetHeight },
        'image/jpeg',
      );
      const cropTime = Date.now() - cropStartTime;

      // Step 4: Read file and prepare payload
      const fileStartTime = Date.now();
      const fileExt = croppedPath.split('.').pop();
      const fileName = `scan-${Date.now()}.${fileExt}`;
      const fileData = await RNFS.readFile(croppedPath, 'base64');

      const bodyPayload = {
        fileName,
        base64Image: fileData,
      };
      const fileTime = Date.now() - fileStartTime;

      // Step 5: Call Supabase function
      const supabaseStartTime = Date.now();
      const { data: dataFromEdge, error } = await supabase.functions.invoke(
        scanLanguage === 'en' ? 'classify-card' : 'clever-api',
        {
          body: bodyPayload,
        },
      );
      const supabaseTime = Date.now() - supabaseStartTime;

      if (error) {
        console.error('[SCAN] classify-card error:', error);
        throw error;
      }

      console.log('dataFromEdge', dataFromEdge);
      setCardName(dataFromEdge.name);

      // Step 6: Database matching
      let matches = null;

      if (scanLanguage === 'jp') {
        // Use Japanese matching function
        matches = await fetchScannerCardFromSupabaseJPStrict(
          dataFromEdge.name,
          dataFromEdge.number,
          dataFromEdge.hp,
          dataFromEdge.illustrator,
        );
      } else {
        // Use English matching function
        matches = await matchCardENStrict({
          name: dataFromEdge.name,
          number: dataFromEdge.number,
          hp: dataFromEdge.hp,
          illustrator: dataFromEdge.illustrator,
        })
      }

      console.log('matches', matches);
     
      // Step 7: Set results
      if (matches?.length === 1) {
        setCardData(matches[0]);
        setCardResults([]);
        setNoResult(false);
      } else if (matches?.length > 1) {
        setCardData(null);
        setCardResults(matches);
        setNoResult(false);
      } else {
        setCardData(null);
        setCardResults([]);
        setNoResult(true);
      }

    } catch (e) {
      setCardName('Error');
      setNoResult(true);
    } finally {
      setLoading(false);
    }
  };

  const clearScanResult = () => {
    setCardName(null);
    setCardData(null);
    setCardResults([]);
    setNoResult(false);
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
        <Ionicons
          name="camera-outline"
          size={64}
          color="#10B981"
          style={{ marginBottom: 16 }}
        />
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
      />

      <View style={styles.closeButtonContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('Collections')}>
          <Ionicons name="close" size={32} color={'#10B981'} />
        </TouchableOpacity>
      </View>

      {/* Language Toggle Dropdown */}
      <View style={styles.languageToggleContainer}>
        <TouchableOpacity
          style={styles.languageToggleButton}
          onPress={() => setShowLanguageDropdown(!showLanguageDropdown)}
        >
          <Text style={styles.languageToggleText}>
            {scanLanguage === 'en' ? '🇺🇸  Scan in English' : '🇯🇵 Scan in Japanese'}
          </Text>
          <Ionicons 
            name={showLanguageDropdown ? "chevron-up" : "chevron-down"} 
            size={16} 
            color="#fff" 
          />
        </TouchableOpacity>
        
        {showLanguageDropdown && (
          <View style={styles.dropdownMenu}>
            <TouchableOpacity
              style={[
                styles.dropdownItem,
                scanLanguage === 'en' && styles.dropdownItemActive
              ]}
              onPress={() => {
                setScanLanguage('en');
                setShowLanguageDropdown(false);
              }}
            >
              <Text style={[
                styles.dropdownItemText,
                scanLanguage === 'en' && styles.dropdownItemTextActive
              ]}>
                🇺🇸 Scan in English
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.dropdownItem,
                scanLanguage === 'jp' && styles.dropdownItemActive
              ]}
              onPress={() => {
                setScanLanguage('jp');
                setShowLanguageDropdown(false);
              }}
            >
              <Text style={[
                styles.dropdownItemText,
                scanLanguage === 'jp' && styles.dropdownItemTextActive
              ]}>
                🇯🇵 Scan in Japanese
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

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
              <Text style={styles.noResultTitle}>
                No cards found
              </Text>
              <Text style={styles.noResultDescription}>
                We couldn't find a match for this scan. Try again with better lighting or clearer framing.
              </Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.scanSection}>
          <ScanButton loading={loading} onPress={onScan} />
          {!loading && <Text style={styles.tapToScanText}>Tap to Scan</Text>}
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
            <Text style={styles.clearFloatingText}>Clear</Text>
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
  errorText: { color: 'red', fontSize: 16, marginBottom: 12 },
  overlay: {
    position: 'absolute',
    bottom: 44,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 150,
    padding: 8,
    borderRadius: 24,
  },
  scrollArea: {
    paddingBottom: 2,
    alignItems: 'center',
  },
  scanSection: {
    marginTop: 8,
    alignItems: 'center',
    gap: 6,
  },
  tapToScanText: {
    color: '#E5E7EB',
    fontSize: 14,
    opacity: 0.9,
    marginTop: 4,
    fontFamily: 'Lato-Bold',
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
  clearFloatingText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  clearIcon: {
    marginTop: 1,
  },
  noResultWrapper: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  noResultTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Lato-Bold',
    color: '#F1F5F9',
    marginBottom: 4,
    textAlign: 'center',
  },
  noResultDescription: {
    fontSize: 14,
    fontFamily: 'Lato-Bold',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#0788b0ff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Lato-Bold',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Lato-Bold',
  },
  permissionSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
    marginBottom: 20,
    fontFamily: 'Lato-Regular',
  },
  permissionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  openSettingsBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
  },
  openSettingsText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Lato-Bold',
  },
  tryAgainText: {
    color: '#10B981',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Lato-Bold',
  },
  languageToggleContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  languageToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    gap: 10,
    minWidth: 160,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  languageToggleText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Lato-Bold',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 50,
    backgroundColor: 'rgba(0,0,0,0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  dropdownItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  dropdownItemText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'Lato-Regular',
    textAlign: 'center',
  },
  dropdownItemTextActive: {
    color: '#10B981',
    fontWeight: '600',
  },
});
