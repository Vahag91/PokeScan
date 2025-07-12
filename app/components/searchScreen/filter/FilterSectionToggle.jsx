import React, { useRef, useEffect } from 'react';
import {
  Text,
  StyleSheet,
  View,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function FilterSectionToggle({ label, expanded, onPress }) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotation, {
      toValue: expanded ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [expanded,rotation]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });

  return (
    <View style={[styles.card, expanded && styles.cardActive]}>
      <Pressable onPress={onPress} style={styles.toggle}>
        <Text style={styles.label}>{label}</Text>
        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
          <Icon 
            name="keyboard-arrow-down" 
            size={24} 
            color={expanded ? "#10B981" : "#64748B"} 
          />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginVertical: 10,
    shadowColor: '#cbd5e1',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  cardActive: {
    shadowColor: '#6366f1',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  toggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  pressed: {
    opacity: 0.9,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '',
    letterSpacing: 0.15,
  },
});

