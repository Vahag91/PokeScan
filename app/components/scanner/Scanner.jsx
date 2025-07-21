import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import PhotoManipulator from 'react-native-photo-manipulator';
import ScanButton from './ScanButton';
import CardPreview from './CardPreview';
import CameraView from './CameraView';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { fetchScannerCardFromSupabase } from '../../../supabase/utils';
import { supabase } from '../../../supabase/supabase';
import RNFS from 'react-native-fs';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function ScannerScreen({ navigation }) {
  const [permission, setPermission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [overlayLayout, setOverlayLayout] = useState(null);
  const [cardName, setCardName] = useState(null);
  const [cardData, setCardData] = useState(null);
  const [cardResults, setCardResults] = useState([]);
  const [croppedImageUri, setCroppedImageUri] = useState(null);

  const device = useCameraDevice('back');
  const cameraRef = useRef(null);

  useEffect(() => {
    Camera.requestCameraPermission().then(status => setPermission(status));
  }, []);

  const onScan = async () => {
    if (!overlayLayout) return;

    try {
      setLoading(true);
      setCardName(null);
      setCardData(null);
      setCardResults([]);
      setCroppedImageUri(null);

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
        { format: 'webp', quality: '50%' }
      );

      setCroppedImageUri(`file://${croppedPath}`);

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
        }
      );

      if (error) throw error;

      setCardName(dataFromEdge.name);

      const matches = await fetchScannerCardFromSupabase(
        dataFromEdge.name,
        dataFromEdge.number,
        dataFromEdge.hp,
        dataFromEdge.illustrator
      );

      if (matches?.length === 1) {
        setCardData(matches[0]);
        setCardResults([]);
      } else if (matches?.length > 1) {
        setCardData(null);
        setCardResults(matches);
      }
    } catch (e) {
      console.error('Scan error:', e);
      setCardName('Error');
    } finally {
      setLoading(false);
    }
  };

  if (permission == null || device == null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading camera…</Text>
      </View>
    );
  }

  if (permission !== 'granted') {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Camera permission denied.</Text>
      </View>
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
        {croppedImageUri && (
          <View style={styles.imagePreviewWrapper}>
            <Text style={styles.previewLabel}>Scanned Preview</Text>
            <Image
              source={{ uri: croppedImageUri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          </View>
        )}

        {cardData ? (
          <CardPreview cardName={cardName} cardData={cardData} />
        ) : cardResults.length > 0 ? (
          <ScrollView
            style={styles.scrollContainer}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {cardResults.map(card => (
              <View key={card.id} style={styles.resultItem}>
                <CardPreview cardName={card.name} cardData={card} />
              </View>
            ))}
          </ScrollView>
        ) : (
          <CardPreview cardName={cardName} cardData={null} />
        )}

        <ScanButton loading={loading} onPress={onScan} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, color: '#888' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'red' },
  overlay: {
    position: 'absolute',
    bottom: 52,
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
  imagePreviewWrapper: {
    alignItems: 'center',
    marginBottom: 12,
  },
  previewLabel: {
    color: '#F1F5F9',
    fontSize: 14,
    marginBottom: 4,
  },
  previewImage: {
    width: 180,
    height: 160,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  scrollContainer: {
    maxHeight: 220,
    marginBottom: 12,
  },
  resultItem: {
    marginHorizontal: 6,
  },
});