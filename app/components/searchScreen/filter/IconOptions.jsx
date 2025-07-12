import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { typeIcons } from '../../../constants';

export default function IconOptions({
  options,
  selectedList,
  setList,
  toggleSelection,
}) {
  return (
    <View style={styles.iconOptionsWrap}>
      {options.map(t => {
        const selected = selectedList.includes(t);
        return (
          <TouchableOpacity
            key={t}
            onPress={() => toggleSelection(selectedList, setList, t)}
            style={[styles.iconBadge, selected && styles.activeIconBadge]}
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
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIconBadge: {
    borderColor: '#10B981',
    borderWidth: 1.5,
  },
  icon: {
    width: 24,
    height: 24,
  },
});
