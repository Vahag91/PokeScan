import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2;

export default function SkeletonCard() {
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-CARD_WIDTH, CARD_WIDTH],
  });

  return (
    <Animated.View style={[styles.card, styles.skeleton]}>
      <Animated.View style={[styles.shimmerWrapper, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
          style={styles.shimmer}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#ddd',
    marginBottom: 16,
  },
  skeleton: {
    backgroundColor: '#e0e0e0',
  },
  shimmerWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  shimmer: {
    width: '100%',
    height: '100%',
  },
});
