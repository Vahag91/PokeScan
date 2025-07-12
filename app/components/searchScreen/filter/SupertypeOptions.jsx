import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const supertypes = [
  { label: 'Pokémon', icon: 'pokeball' },
  { label: 'Trainer', icon: 'account-tie' },
  { label: 'Energy', icon: 'flash' },
];

export default function SupertypeOptions({ selected, setSelected }) {
  const toggle = value => {
    setSelected(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  return (
    <View style={styles.wrap}>
      {supertypes.map(({ label, icon }) => {
        const active = selected.includes(label);
        return (
          <TouchableOpacity
            key={label}
            onPress={() => toggle(label)}
            style={[styles.chip, active && styles.chipActive]}
            activeOpacity={0.85}
          >
            <View style={styles.content}>
              <Icon
                name={icon}
                size={16}
                color={active ? '#fff' : '#475569'}
                style={styles.icon}
              />
              <Text style={[styles.text, active && styles.textActive]}>
                {label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    marginTop: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  chipActive: {
    backgroundColor: '#10B981',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  textActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
