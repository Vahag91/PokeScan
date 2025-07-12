import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Camera } from 'react-native-vision-camera';

export default function CameraView({ cameraRef, device, onOverlayLayout }) {
  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scanAnim, pulseAnim]);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 400],
  });

  return (
    <>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        photo
        photoQualityBalance="quality"
      />

      {/* Scan frame */}
      <View
        style={styles.frameOverlay}
        onLayout={({ nativeEvent }) => onOverlayLayout(nativeEvent.layout)}
      >
        <Animated.View
          style={[
            styles.scanLine,
            {
              transform: [{ translateY }],
              opacity: pulseAnim,
            },
          ]}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  frameOverlay: {
    position: 'absolute',
    top: '20%',
    left: '16%',
    width: 265,
    height: 370,
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.03)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 4,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
});
