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
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, FRAME_HEIGHT],
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

      <View style={[StyleSheet.absoluteFill, styles.container]}>
        <View style={[styles.mask, styles.topMask]} />
        <View style={styles.centerRow}>
          <View style={styles.sideMask} />
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

            <View style={styles.cornerTopLeft} />
            <View style={styles.cornerTopRight} />
            <View style={styles.cornerBottomLeft} />
            <View style={styles.cornerBottomRight} />
          </View>
          <View style={styles.sideMask} />
        </View>
        <View style={[styles.mask, styles.bottomMask]} />
      </View>
    </>
  );
}

const FRAME_WIDTH = 265;
const FRAME_HEIGHT = 370;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'flex-start', 
  },
  frameOverlay: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.02)',
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 4,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  mask: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  topMask: {
    height: '20%', 
  },
  bottomMask: {
    flex: 1, 
  },
  centerRow: {
    flexDirection: 'row',
  },
  sideMask: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#10B981',
    borderTopLeftRadius: 4,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#10B981',
    borderTopRightRadius: 4,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#10B981',
    borderBottomLeftRadius: 4,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#10B981',
    borderBottomRightRadius: 4,
  },
});
