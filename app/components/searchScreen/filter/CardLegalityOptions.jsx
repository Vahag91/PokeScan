// components/searchScreen/filter/CardLegalityOptions.js
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const LEGALITY_OPTIONS = ['Standard', 'Expanded', 'Unlimited'];

export default function CardLegalityOptions({ selected, setSelected }) {
  const toggle = value => {
    setSelected(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  return (
    <View style={styles.wrap}>
      {LEGALITY_OPTIONS.map(option => {
        const isSelected = selected.includes(option);
        return (
          <TouchableOpacity
            key={option}
            onPress={() => toggle(option)}
            style={[styles.chip, isSelected && styles.chipActive]}
            activeOpacity={0.85}
          >
            <Text style={[styles.text, isSelected && styles.textActive]}>
              {option}
            </Text>
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
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 8,
    paddingHorizontal: 25,
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
