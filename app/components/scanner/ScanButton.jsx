import React, { useEffect, useRef, useCallback } from 'react';
import {
  TouchableWithoutFeedback,
  Animated,
  StyleSheet,
  View,
  Easing,
  Vibration,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';

export default function ScanButton({ loading, onPress }) {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;

  const ballIcon = require('../../assets/cards/other/scanMon.png');

  useEffect(() => {
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    glowLoop.start();
    pulseLoop.start();

    return () => {
      glowLoop.stop();
      pulseLoop.stop();
    };
  }, [glowAnim, pulseAnim]);

  useEffect(() => {
    if (loading) {
      spinAnim.setValue(0);
      scaleAnim.setValue(1);

      const spinLoop = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

      const bounceLoop = Animated.loop(
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: 1.08,
            friction: 3,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            useNativeDriver: true,
          }),
        ])
      );

      spinLoop.start();
      bounceLoop.start();

      return () => {
        spinLoop.stop();
        bounceLoop.stop();
      };
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(spinAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading, scaleAnim, spinAnim]);

  const rotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.025],
  });

  const rippleScale = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5],
  });

  const rippleOpacity = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0],
  });

const playRipple = useCallback(() => {
  rippleAnim.setValue(0);
  Animated.timing(rippleAnim, {
    toValue: 1,
    duration: 700,
    easing: Easing.out(Easing.quad),
    useNativeDriver: true,
  }).start();
}, [rippleAnim]);

const handlePress = useCallback(() => {
  Vibration.vibrate(10);
  playRipple();
  onPress();
}, [onPress, playRipple]);


  const animatedFabStyle = {
    transform: [{ scale: scaleAnim }, { scale: pulseScale }],
    opacity: loading ? 0.85 : 1,
  };

  const animatedGlowStyle = {
    transform: [{ scale: glowScale }],
    opacity: 0.35,
  };

  const animatedIconStyle = {
    transform: [{ rotate: loading ? rotate : '0deg' }, { scale: loading ? 1 : 0.95 }],
  };

  const animatedRippleStyle = {
    transform: [{ scale: rippleScale }],
    opacity: rippleOpacity,
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress} disabled={loading}>
      <View style={styles.container}>
        {/* Radar ping effect */}
        <Animated.View style={[styles.ripple, animatedRippleStyle]} />

        {/* Glow */}
        <Animated.View style={[styles.glow, animatedGlowStyle]} />

        {/* Button */}
        <Animated.View style={[styles.fab, animatedFabStyle]}>
          <BlurView
            style={styles.blurCircle}
            blurType="light"
            blurAmount={8}
            reducedTransparencyFallbackColor="#10B981"
          />
          <Animated.Image source={ballIcon} style={[styles.icon, animatedIconStyle]} />
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 96,
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#10B981',
  },
  ripple: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#6EE7B7',
  },
  fab: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  blurCircle: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 40,
  },
  icon: {
    width: 34,
    height: 34,
    resizeMode: 'contain',
    borderRadius: "50%"
  },
});


      // {croppedImageUri && (
      //     <View style={styles.imagePreviewWrapper}>
      //       <Text style={styles.previewLabel}>Scanned Image:</Text>
      //       <Image
      //         source={{ uri: croppedImageUri }}
      //         style={styles.previewImage}
      //         resizeMode="contain"
      //       />
      //     </View>
      //   )}