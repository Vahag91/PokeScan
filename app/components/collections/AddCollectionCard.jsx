import React, { useContext } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ThemeContext } from '../../context/ThemeContext';
import { globalStyles } from '../../../globalStyles';

export default function AddCollectionCard({ onPress }) {
  const { theme } = useContext(ThemeContext);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: theme.cardCollectionBackground,
          borderColor: theme.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.iconWrapper, { backgroundColor: '#ECFDF5' }]}>
        <Ionicons name="add" size={28} color="#10B981" />
      </View>
      <Text style={[globalStyles.smallText, styles.text, { color: theme.text }]}>
        New Collection
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 100,
    marginHorizontal: 12,
    marginTop: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 4,
      },
    }),
  },
  iconWrapper: {
    padding: 10,
    borderRadius: 50,
    marginBottom: 6,
  },
  text: {
    fontWeight: '600',
  },
});