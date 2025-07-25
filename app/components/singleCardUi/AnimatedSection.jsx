import React, { useRef, useEffect, useContext } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';

export default function AnimatedSection({ children }) {
  const { theme } = useContext(ThemeContext);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View
      style={[
        getStyles(theme).sectionBox,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    sectionBox: {
      backgroundColor: theme.inputBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
  });