import React, { useEffect, useRef } from 'react';
import {
  Animated,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
  Easing,
} from 'react-native';

export default function AnimatedCard({ item, delay, onPress }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.card,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity onPress={() => onPress(item.id)} activeOpacity={0.85}>
        <Image source={item.image} style={styles.image} />
        <Text style={styles.cardText}>{item.title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    width: '48%',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  image: {
    height: 100,
    width: '100%',
    borderRadius: 12,
    resizeMode: 'contain',
    marginBottom: 10,
    backgroundColor: '#F8FAFC',
  },
  cardText: {
    textAlign: 'center',
    color: '#0F172A',
    fontWeight: '600',
    fontSize: 15,
  },
});
