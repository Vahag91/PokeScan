import React, { useState, useEffect, useRef } from 'react';
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
import { fetchScannerCardFromSupabase } from '../../../supabase/utils';
import { supabase } from '../../../supabase/supabase';
import RNFS from 'react-native-fs';

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

    try {
      setLoading(true);
      setCardName(null);
      setCardData(null);
      setCardResults([]);
      setNoResult(false);

      const photo = await cameraRef.current.takePhoto();
      const uri = photo.path.startsWith('file://')
        ? photo.path
        : `file://${photo.path}`;

      const scaleX = (photo.width / SCREEN_WIDTH) * 0.8;
      const scaleY = photo.height / SCREEN_HEIGHT;
      const box = {
        x: Math.round(overlayLayout.x * scaleX) * 0.4,
        y: -Math.round(overlayLayout.y * scaleY) * 0.8 + 900,
        width: Math.round(overlayLayout.width * scaleX * 0.85),
        height: Math.round(overlayLayout.height * scaleY) * 1.7 + 100,
      };

      const targetWidth = 700;
      const aspectRatio = box.height / box.width;
      const targetHeight = Math.round(targetWidth * aspectRatio);
      const croppedPath = await PhotoManipulator.crop(
        uri,
        box,
        { width: targetWidth, height: targetHeight },
        { format: 'webp', quality: '50%' },
      );
      const fileExt = croppedPath.split('.').pop();
      const fileName = `scan-${Date.now()}.${fileExt}`;
      const fileData = await RNFS.readFile(croppedPath, 'base64');

      const { data: dataFromEdge, error } = await supabase.functions.invoke(
        'classify-card',
        {
          body: {
            fileName,
            base64Image: fileData,
          },
        },
      );

      if (error) throw error;

      setCardName(dataFromEdge.name);
      const matches = await fetchScannerCardFromSupabase(
        dataFromEdge.name,
        dataFromEdge.number,
        dataFromEdge.hp,
        dataFromEdge.illustrator,
      );

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
      console.error('Scan error:', e);
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
      <Ionicons name="camera-outline" size={64} color="#10B981" style={{ marginBottom: 16 }} />
      <Text style={styles.permissionTitle}>Camera Access Needed</Text>
      <Text style={styles.permissionSubtitle}>
        Please enable camera access in your device settings to scan Pokémon cards.
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

      <View style={styles.overlay}>
        <ScrollView
          contentContainerStyle={styles.scrollArea}
          showsVerticalScrollIndicator={false}
        >
          {cardData ? (
            <CardPreview cardName={cardName} cardData={cardData} />
          ) : cardResults.length > 0 ? (
            <CardCarouselPreview cards={cardResults} />
          ) : noResult ? (
            <View style={styles.noResultWrapper}>
              <Text style={styles.noResultTitle}>No cards found</Text>
              <Text style={styles.noResultDescription}>
                We couldn't find a match for this scan. Try again with better
                lighting or clearer framing.
              </Text>

              <TouchableOpacity
                onPress={onScan}
                style={styles.retryButton}
                disabled={loading}
              >
                <Text style={styles.retryButtonText}>
                  {loading ? 'Scanning...' : 'Try Again'}
                </Text>
              </TouchableOpacity>
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
    zIndex: 100,
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

});
