import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  ActivityIndicator
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import Ionicons from 'react-native-vector-icons/Ionicons';

const CameraScreen = ({ navigation }) => {
  const camera = useRef(null);
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [flashMode, setFlashMode] = useState('off');

  useEffect(() => {
    // Handle camera activity when tab changes
    const unsubscribeFocus = navigation.addListener('focus', () => {
      setIsActive(true);
    });
    
    const unsubscribeBlur = navigation.addListener('blur', () => {
      setIsActive(false);
    });

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);

  const handleFlashToggle = () => {
    setFlashMode(prev => prev === 'off' ? 'on' : 'off');
  };

  const handleTakePicture = async () => {
    if (!camera.current || isLoading) return;
    
    setIsLoading(true);
    try {
      const photo = await camera.current.takePhoto({
        qualityPrioritization: 'quality',
        flash: flashMode,
      });
      
      console.log('Photo taken:', photo.path);
      // Navigate to card details with the photo path
      navigation.navigate('SingleCardScreen', { photoPath: photo.path });
    } catch (error) {
      console.error('Failed to take photo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasPermission) {
    requestPermission();
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#D21312" />
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-off" size={40} color="#D21312" />
        <Text style={styles.permissionText}>Camera device not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        photo={true}
        enableZoomGesture={true}
      />
      
      {/* Overlay elements */}
      <View style={styles.overlay}>
        <View style={styles.scanFrame}>
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />
        </View>
        <Text style={styles.instructionText}>Align the Pokemon card within the frame</Text>
      </View>
      
      {/* Top controls */}
      <TouchableOpacity 
        style={styles.flashButton}
        onPress={handleFlashToggle}
      >
        <Ionicons 
          name={flashMode === 'on' ? 'flash' : 'flash-off'} 
          size={24} 
          color="white" 
        />
      </TouchableOpacity>
      
      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity 
          style={styles.scanButton}
          onPress={handleTakePicture}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <View style={styles.scanButtonInner}>
              <View style={styles.scanButtonOuter} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};
export default CameraScreen;
// ... keep your existing styles ...

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  permissionText: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 350,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    borderColor: 'yellow',
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRightWidth: 3,
    borderTopWidth: 3,
    borderColor: 'yellow',
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderColor: 'yellow',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: 'yellow',
  },
  instructionText: {
    color: 'white',
    marginTop: 20,
    fontSize: 16,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  flashButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scanButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButtonOuter: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});

