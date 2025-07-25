import React from 'react';
import {
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';

export default function StatCard({ label, value, textColor, theme }) {
  const scale = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          transform: [{ scale }],
        },
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.statCard,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.label, { color: theme.mutedText }]}>{label}</Text>
        <Text style={[styles.value, { color: textColor?.color || theme.text }]}>
          {value}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    flex: 1,
    marginHorizontal: 4,
    marginVertical: 6,
  },
  statCard: {
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});