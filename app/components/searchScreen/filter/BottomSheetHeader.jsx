import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function BottomSheetHeader({ title, onClose,iconSize = 24 }) {
  return (
    <View style={styles.sheetHeader}>
      <Text style={styles.sheetTitle}>{title}</Text>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Icon name="close" size={iconSize} color={"#10B981"} />
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
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
});
