import React, { useRef, useEffect, useContext } from 'react';
import {
  Text,
  StyleSheet,
  View,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ThemeContext } from '../../../context/ThemeContext';
import { globalStyles } from '../../../../globalStyles';
export default function FilterSectionToggle({ label, expanded, onPress }) {
  const { theme } = useContext(ThemeContext);
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotation, {
      toValue: expanded ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [expanded, rotation]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.inputBackground },
        expanded && styles.cardActive,
      ]}
    >
      <Pressable onPress={onPress} style={styles.toggle}>
        <Text
          style={[
            globalStyles.subheading,
            styles.label,
            { color: theme.text },
          ]}
        >
          {label}
        </Text>
        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
          <Icon
            name="keyboard-arrow-down"
            size={24}
            color={expanded ? '#10B981' : theme.secondaryText}
          />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
  label: {
    letterSpacing: 0.15,
  },
});