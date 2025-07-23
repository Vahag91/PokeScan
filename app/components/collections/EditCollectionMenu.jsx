import React, { useContext } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ThemeContext } from '../../context/ThemeContext';
import { globalStyles } from '../../../globalStyles';
export default function EditCollectionMenu({ onDelete, onEditPress, item }) {
  const { theme } = useContext(ThemeContext);

  return (
    <Menu>
      <MenuTrigger>
        <Ionicons name="ellipsis-vertical" size={20} color="#10B981" />
      </MenuTrigger>
      <MenuOptions customStyles={getOptionsStyles(theme)}>
        <MenuOption onSelect={() => onEditPress(item)}>
          <View style={styles.optionRow}>
            <Ionicons name="create-outline" size={16} color="#10B981" />
            <Text style={[globalStyles.body, { color: theme.text }]}>Edit</Text>
          </View>
        </MenuOption>
        <MenuOption onSelect={() => onDelete(item)}>
          <View style={styles.optionRow}>
            <Ionicons name="trash-outline" size={16} color="#DC2626" />
            <Text style={[globalStyles.body, { color: '#DC2626' }]}>Delete</Text>
          </View>
        </MenuOption>
      </MenuOptions>
    </Menu>
  );
}

const getOptionsStyles = (theme) => ({
  optionsContainer: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: theme.cardCollectionBackground,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    width: 120,
  },
});

const styles = StyleSheet.create({
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 10,
  },
});