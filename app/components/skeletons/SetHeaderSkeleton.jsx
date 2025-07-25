import React, { useEffect, useRef, useContext } from 'react';
import { Animated, View, StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ThemeContext } from '../../context/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function SetHeaderSkeleton() {
  const shimmerAnim = useRef(new Animated.Value(-1)).current;
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>  
      <View style={[styles.logoPlaceholder, { backgroundColor: theme.border }]} />

      <View style={styles.row}>
        <View style={[styles.symbolPlaceholder, { backgroundColor: theme.border }]} />
        <View style={[styles.titlePlaceholder, { backgroundColor: theme.border }]} />
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaBox}>
          <View style={[styles.iconPlaceholder, { backgroundColor: theme.border }]} />
          <View style={[styles.metaLine, { backgroundColor: theme.border }]} />
        </View>
        <View style={styles.metaBox}>
          <View style={[styles.iconPlaceholder, { backgroundColor: theme.border }]} />
          <View style={[styles.metaLine, { backgroundColor: theme.border }]} />
        </View>
      </View>

      <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
          style={styles.shimmerGradient}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
    overflow: 'hidden',
  },
  logoPlaceholder: {
    width: 160,
    height: 100,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    columnGap: 8,
  },
  symbolPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  titlePlaceholder: {
    width: 160,
    height: 20,
    borderRadius: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    columnGap: 40,
  },
  metaBox: {
    flexDirection:"row",
    alignItems: 'center',
    gap: 8,
  },
  iconPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 4,
    // marginBottom: 6,
  },
  metaLine: {
    width: 60,
    height: 14,
    borderRadius: 4,
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  shimmerGradient: {
    width: '100%',
    height: '100%',
  },
});