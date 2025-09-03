// components/ScanStatusPill_VariantB.js
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform, Image } from 'react-native';

export default function ScanStatusPill({ stage = 'idle', capturedImage = null }) {
  if (stage === 'idle') return null;

  const label = stage === 'scanning' ? 'Scanning…' : 'Hunting the match!';
  const hint  = stage === 'scanning' ? 'Reading card details' : 'Let’s find your card';
  const accent = stage === 'scanning' ? '#10B981' : '#F59E0B';

  // Dots
  const [dots, setDots] = useState('');
  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d.length === 3 ? '' : d + '.')), 300);
    return () => clearInterval(t);
  }, []);

  // Enter + pulse
  const enter = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.02, duration: 800, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [enter, pulse]);

  // Tiny indeterminate bar (width bounce)
  const widthAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(widthAnim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
        Animated.timing(widthAnim, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [widthAnim]);

  const w = widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['18%', '70%'] });
  const translateXEnter = enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
  const opacityEnter = enter.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <Animated.View
      style={[
        styles.wrap,
        { transform: [{ translateY: -28 }, { translateX: translateXEnter }, { scale: pulse }], opacity: opacityEnter },
      ]}
      pointerEvents="none"
    >
      <View style={[styles.pill, { borderColor: `${accent}55` }]}>
        {/* Left dot: image or emoji */}
        {capturedImage ? (
          <Image source={{ uri: capturedImage }} style={[styles.dot, { borderColor: `${accent}77` }]} />
        ) : (
          <View style={[styles.dot, { alignItems: 'center', justifyContent: 'center', borderColor: `${accent}77` }]}>
            <Text style={styles.emoji}>{stage === 'scanning' ? '📸' : '🔍'}</Text>
          </View>
        )}

        <View style={styles.texts}>
          <Text style={styles.title}>
            {label}
            {dots}
          </Text>
          <Text style={styles.hint}>{hint}</Text>

          <View style={styles.lineTrack}>
            <Animated.View style={[styles.lineFill, { width: w, backgroundColor: accent }]} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: '50%',
    left: 16,
    right: 16,
    zIndex: 120,
    alignItems: 'center',
  },
  pill: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'rgba(0,0,0,0.86)',
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 8, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 5 },
    }),
  },

  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginRight: 10,
  },
  emoji: { fontSize: 16 },

  texts: { flex: 1 },
  title: { color: '#F8FAFC', fontSize: 13.5, fontWeight: '800', letterSpacing: 0.2 },
  hint: { color: '#B6C2CF', fontSize: 11, marginTop: 2 },

  lineTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 8,
  },
  lineFill: {
    height: 4,
    borderRadius: 999,
  },
});
