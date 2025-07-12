import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function HeaderActionButton({ icon, label, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.filterButton}
      activeOpacity={0.7}
    >
      <View style={styles.filterButtonContent}>
        <Icon name={icon} size={20} color="#1E293B" style={styles.filterIcon} />
        <Text style={styles.filterButtonText}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  filterButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterIcon: {
    marginRight: 6,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
});
