// components/CameraView.js
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated, Image, Platform } from 'react-native';
import { Camera } from 'react-native-vision-camera';

export default function CameraView({
  cameraRef,
  device,
  onOverlayLayout,
  stage = 'idle',             // 'idle' | 'scanning' | 'searching'
  freezeUri = null,           // 👈 file:// uri of captured image
  shouldFreeze = false,       // 👈 when true, show blurred overlay
}) {
  // Fade overlay in/out when shouldFreeze toggles
  const freezeOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(freezeOpacity, {
      toValue: shouldFreeze && freezeUri ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [shouldFreeze, freezeUri, freezeOpacity]);

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

      {/* Freeze/blur overlay: shows the captured image with a light blur and dim */}
      {freezeUri ? (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { opacity: freezeOpacity }]}
        >
          <Image
            source={{ uri: freezeUri }}
            style={styles.freezeImage}
            resizeMode="cover"
            // blurRadius works on both iOS/Android for Image
            blurRadius={Platform.OS === 'ios' ? 16 : 8}
          />
          <View style={styles.freezeDim} />
        </Animated.View>
      ) : null}

      {/* Masks + framing box */}
      <View style={[StyleSheet.absoluteFill, styles.container]}>
        <View style={[styles.mask, styles.topMask]} />
        <View style={styles.centerRow}>
          <View style={styles.sideMask} />
          <View
            style={styles.frameOverlay}
            onLayout={({ nativeEvent }) => onOverlayLayout && onOverlayLayout(nativeEvent.layout)}
          >
            {/* Minimal, in-frame instruction when idle */}
            {stage === 'idle' && (
              <View style={styles.instructionBanner}>
                <Text style={styles.instructionText}>
                  Position card, tap <Text style={styles.instructionHighlight}>SCAN</Text>
                </Text>
              </View>
            )}

            {/* Corner brackets */}
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
  container: { justifyContent: 'flex-start' },

  // Camera masks
  mask: { backgroundColor: 'rgba(0,0,0,0.55)' },
  topMask: { height: '20%' },
  bottomMask: { flex: 1 },
  centerRow: { flexDirection: 'row' },
  sideMask: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },

  // Main frame
  frameOverlay: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    borderWidth: 2,
    borderColor: '#10B981',
    backgroundColor: 'rgba(16,185,129,0.02)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Freeze overlay
  freezeImage: {
    width: '100%',
    height: '100%',
  },
  freezeDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  // Corner brackets
  cornerTopLeft: {
    position: 'absolute', top: 0, left: 0, width: 20, height: 20,
    borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#10B981', borderTopLeftRadius: 4,
  },
  cornerTopRight: {
    position: 'absolute', top: 0, right: 0, width: 20, height: 20,
    borderTopWidth: 3, borderRightWidth: 3, borderColor: '#10B981', borderTopRightRadius: 4,
  },
  cornerBottomLeft: {
    position: 'absolute', bottom: 0, left: 0, width: 20, height: 20,
    borderBottomWidth: 3, borderLeftWidth: 3, borderColor: '#10B981', borderBottomLeftRadius: 4,
  },
  cornerBottomRight: {
    position: 'absolute', bottom: 0, right: 0, width: 20, height: 20,
    borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#10B981', borderBottomRightRadius: 4,
  },

  // Transparent glass-morphism instruction box
  instructionBanner: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
    backdropFilter: 'blur(10px)',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: 18,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  instructionHighlight: {
    color: '#10B981',
    fontWeight: '800',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
