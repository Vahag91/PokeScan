import React, { createContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import { lightTheme, darkTheme } from '../theme/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeName, setThemeName] = useState('light');
  const [manualTheme, setManualTheme] = useState(false);

  const theme = themeName === 'dark' ? darkTheme : lightTheme;

  const toggleTheme = async () => {
    const newTheme = themeName === 'dark' ? 'light' : 'dark';
    setThemeName(newTheme);
    setManualTheme(true);
    await AsyncStorage.setItem('manualTheme', newTheme);
  };

  useEffect(() => {
    const loadTheme = async () => {
      const stored = await AsyncStorage.getItem('manualTheme');
      if (stored) {
        setThemeName(stored);
        setManualTheme(true);
      } else {
        const system = Appearance.getColorScheme();
        setThemeName(system === 'dark' ? 'dark' : 'light');
      }
    };

    loadTheme();
  }, []);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (!manualTheme) {
        setThemeName(colorScheme === 'dark' ? 'dark' : 'light');
      }
    });

    return () => subscription.remove();
  }, [manualTheme]);

  return (
    <ThemeContext.Provider value={{ theme, themeName, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
