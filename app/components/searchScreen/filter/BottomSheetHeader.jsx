import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ThemeContext } from '../../../context/ThemeContext';
import { globalStyles } from '../../../../globalStyles';

export default function BottomSheetHeader({ title, onClose, iconSize = 24 }) {
  const { theme } = useContext(ThemeContext);

  return (
    <View style={styles.sheetHeader}>
      <Text style={[globalStyles.subheading, styles.title, { color: theme.text }]}>
        {title}
      </Text>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Icon name="close" size={iconSize} color="#10B981" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    padding: 2,
    borderRadius: 12,
  },
  title: {
    textAlign: 'center',
  },
});