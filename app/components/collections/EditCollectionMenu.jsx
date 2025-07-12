import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function EditCollectionMenu({ onDelete, onEditPress, item }) {
  return (
    <Menu>
      <MenuTrigger>
        <Ionicons name="ellipsis-vertical" size={20} color="#10B981" />
      </MenuTrigger>
      <MenuOptions customStyles={styles.optionsContainer}>
        <MenuOption onSelect={() => onEditPress(item)}>
          <View style={styles.optionRow}>
            <Ionicons name="create-outline" size={16} color="#10B981" />
            <Text style={styles.optionText}>Edit</Text>
          </View>
        </MenuOption>
        <MenuOption onSelect={() => onDelete(item)}>
          <View style={styles.optionRow}>
            <Ionicons name="trash-outline" size={16} color="#DC2626" />
            <Text style={[styles.optionText, { color: '#DC2626' }]}>
              Delete
            </Text>
          </View>
        </MenuOption>
      </MenuOptions>
    </Menu>
  );
}

const styles = StyleSheet.create({
  optionsContainer: {
    optionsContainer: {
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 12,
      backgroundColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
      elevation: 6,
      width: 120,
    },
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 10,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
  },
});
