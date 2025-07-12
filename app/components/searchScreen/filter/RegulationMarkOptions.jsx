import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const REGULATION_MARKS = ['D', 'E', 'F', 'G', 'H'];

export default function RegulationMarkOptions({ selected, setSelected }) {
  const toggle = mark => {
    setSelected(prev =>
      prev.includes(mark) ? prev.filter(m => m !== mark) : [...prev, mark],
    );
  };

  return (
    <View style={styles.wrap}>
      {REGULATION_MARKS.map(mark => {
        const isSelected = selected.includes(mark);
        return (
          <TouchableOpacity
            key={mark}
            onPress={() => toggle(mark)}
            style={[styles.badge, isSelected && styles.activeBadge]}
            activeOpacity={0.85}
          >
            <Text style={[styles.text, isSelected && styles.activeText]}>
              {mark}
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
    gap: 10,
    justifyContent: 'center',
  },
  badge: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeBadge: {
    borderColor: '#10B981',
    borderWidth: 1,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  activeText: {
    color: 'black',
  },
});
