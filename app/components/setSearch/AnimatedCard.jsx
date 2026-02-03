import React, { useEffect, useRef, useContext, useMemo } from 'react';
import {
  Animated,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
  Easing,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../../context/ThemeContext';

export default function AnimatedCard({ item, delay, onPress, setStats }) {
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const { theme } = useContext(ThemeContext);

  // Try to match by setId first, then by setName as fallback
  const ownedCount = setStats?.[item.id] || setStats?.[item.title] || 0;

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
  }, [delay, fadeAnim, scaleAnim]);

  const styles = useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: theme.background,
      borderRadius: 16,
      padding: 12,
      width: '48%',
      borderWidth: 1,
      borderColor: theme.border,
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
    },
    cardText: {
      textAlign: 'center',
      color: theme.text,
      fontWeight: '600',
      fontSize: 15,
    },
    countText: {
      marginTop: 4,
      fontSize: 13,
      textAlign: 'center',
      color: theme.mutedText,
      fontFamily: 'Lato-Regular',
    }
  }), [theme]);

  return (
    <Animated.View
      style={[
        styles.card,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity onPress={() => onPress(item)} activeOpacity={0.85}>
        <Image source={item.image} style={styles.image} />
        <Text style={styles.cardText}>{item.title}</Text>
        <Text style={styles.countText}>
          {ownedCount} {t('sets.owned')}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
