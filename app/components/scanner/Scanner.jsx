import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
// import TextRecognition, {
//   TextRecognitionScript,
// } from '@react-native-ml-kit/text-recognition';
import PhotoManipulator from 'react-native-photo-manipulator';
import {
  fetchCardByNameAndNumber,
  classifyImageWithOpenAI,
} from '../../lib/openai';
import ScanButton from './ScanButton';
import CardPreview from './CardPreview';
import CameraView from './CameraView';
import Ionicons from 'react-native-vector-icons/Ionicons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function ScannerScreen({ navigation }) {
  const [permission, setPermission] = useState(null);
  const [loading, setLoading] = useState(false);
  // const [recognizedText, setRecognizedText] = useState(null);
  const [overlayLayout, setOverlayLayout] = useState(null);
  const [cardName, setCardName] = useState(null);
  const [cardData, setCardData] = useState(null);
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
      // setRecognizedText(null);
      setCardName(null);
      setCardData(null);

      const photo = await cameraRef.current.takePhoto({
        // avoid motion blur from flash lag
      });

      const uri = photo.path.startsWith('file://')
        ? photo.path
        : `file://${photo.path}`;

      const scaleX = (photo.width / SCREEN_WIDTH) *0.9;
      const scaleY = (photo.height / SCREEN_HEIGHT);

      const box = {
        x: Math.round(overlayLayout.x * scaleX) * 0.05,
        y: Math.round(overlayLayout.y * scaleY) * 1.5,
        width: Math.round(overlayLayout.width * scaleX * 0.85),
        height: Math.round(overlayLayout.height * scaleY) * 2,
      };

      const targetWidth = 700;
      const aspectRatio = box.height / box.width;
      const targetHeight = Math.round(targetWidth * aspectRatio);
      const croppedPath = await PhotoManipulator.crop(
        uri,
        box,
        { width: targetWidth, height: targetHeight },
        { format: 'jpeg', quality: "100%"},
      );
      setCroppedImageUri(croppedPath);
      // const ocr = await TextRecognition.recognize(
      //   croppedPath,
      //   TextRecognitionScript.LATIN,
      // );
      // setRecognizedText(ocr.text);

      // const data = await classifyWithOpenAI(ocr.text);
      // setCardName(data.name);
      // const card = await fetchCardByNameAndHp(data.name, data.hp);
      const data = await classifyImageWithOpenAI('https://relentlessdragon.com/wp-content/uploads/2019/10/Charizard-Legendary-Collection3.jpg');

      setCardName(data.name);
      const card = await fetchCardByNameAndNumber(
        data.name,
        data.number,
        data.hp,
      );
      if (card) {
        setCardData(card);
      } else {
        console.log(
          `No card found matching ${data.name}${
            data.hp ? ` @ ${data.hp} HP` : ''
          }`,
        );
      }
    } catch (e) {
      console.error('Scan error:', e);
      // setRecognizedText('Error');
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
      {/* 🔙 Close Button */}
      <View style={styles.closeButtonContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('Collections')}>
          <Ionicons name="close" size={32} color={'#10B981'} />
        </TouchableOpacity>
      </View>

      <View style={styles.overlay}>
        {/* {croppedImageUri && (
          <Image
            source={{ uri: croppedImageUri }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        )} */}
        <CardPreview cardName={cardName} cardData={cardData} />
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
});
