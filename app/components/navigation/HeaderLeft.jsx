import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function HeaderLeft({ onPress, iconColor }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.headerLeft}>
      <Ionicons name="menu" size={24} color={iconColor} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  headerLeft: {
    paddingHorizontal: 16,
  },
});