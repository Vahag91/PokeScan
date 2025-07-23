import React, { useContext } from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { typeIcons } from '../../../constants';
import { ThemeContext } from '../../../context/ThemeContext';

export default function IconOptions({
  options,
  selectedList,
  setList,
  toggleSelection,
}) {
  const { theme } = useContext(ThemeContext);

  return (
    <View style={styles.iconOptionsWrap}>
      {options.map(t => {
        const selected = selectedList.includes(t);
        return (
          <TouchableOpacity
            key={t}
            onPress={() => toggleSelection(selectedList, setList, t)}
            style={[
              styles.iconBadge,
              {
                backgroundColor: theme.cardCollectionBackground,
                borderColor: selected ? '#10B981' : theme.border,
                borderWidth: selected ? 1.5 : 1,
              },
            ]}
          >
            <Image
              source={typeIcons[t]}
              style={styles.icon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  iconOptionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 24,
    height: 24,
  },
});