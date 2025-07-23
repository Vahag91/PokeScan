import React, { useEffect, useRef, useCallback, useContext } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BlurView } from '@react-native-community/blur';
import { ThemeContext } from '../../context/ThemeContext';
export default function CollectionHeaderButton({ isInCollection, onPress }) {
  const { theme } = useContext(ThemeContext);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animate = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim]);

  useEffect(() => {
    if (isInCollection !== undefined) animate();
  }, [isInCollection, animate]);

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { transform: [{ scale: scaleAnim }], backgroundColor: theme.inputBackground },
      ]}
    >
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType={theme.mode === 'dark' ? 'dark' : 'light'}
        blurAmount={10}
      />
      <TouchableOpacity
        onPress={onPress}
        style={styles.button}
        activeOpacity={0.85}
      >
        <Ionicons
          name={isInCollection ? 'star-sharp' : 'star-outline'}
          size={28}
          color="#eab956ff"
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});