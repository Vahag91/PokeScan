import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function CollectionHeaderButton({ isInCollection, onPress }) {
  // Animation values
  const pulseScale = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;
  
  const prevIsInCollection = useRef(null);

  const animate = useCallback(() => {
    // Reset all animations
    pulseScale.setValue(1);
    rotateAnim.setValue(0);
    glowOpacity.setValue(0);
    iconScale.setValue(1);

    // Create a complex animation sequence
    Animated.parallel([
      // Pulse effect
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      
      // Rotation effect
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      
      // Glow effect
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      
      // Icon bounce
      Animated.sequence([
        Animated.timing(iconScale, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(iconScale, {
          toValue: 1.1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(iconScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [pulseScale, rotateAnim, glowOpacity, iconScale]);

  useEffect(() => {
    // Only animate if we have a previous value and it's different from current
    if (prevIsInCollection.current !== null && 
        prevIsInCollection.current !== isInCollection && 
        isInCollection !== null) {
      animate();
    }
    
    // Update the previous value
    prevIsInCollection.current = isInCollection;
  }, [isInCollection, animate]);

  // Interpolate rotation
  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={styles.wrapper}>
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: glowOpacity,
            transform: [{ scale: pulseScale }],
          },
        ]}
      />
      
      {/* Main button */}
      <TouchableOpacity
        onPress={onPress}
        style={styles.button}
        activeOpacity={0.7}
      >
        <Animated.View
          style={{
            transform: [
              { scale: iconScale },
              { rotate: rotation },
            ],
          }}
        >
          <Ionicons
            name={isInCollection ? 'star-sharp' : 'star-outline'}
            size={28}
            color="#eab956ff"
          />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(234, 185, 86, 0.3)',
    shadowColor: '#eab956',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});