import React, { useContext } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ThemeContext } from '../../../context/ThemeContext';
import { globalStyles } from '../../../../globalStyles';
const LEGALITY_OPTIONS = ['Standard', 'Expanded', 'Unlimited'];

export default function CardLegalityOptions({ selected, setSelected }) {
  const { theme } = useContext(ThemeContext);

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
            style={[
              styles.chip,
              { backgroundColor: isSelected ? '#10B981' : theme.inputBackground },
              isSelected && styles.chipActive,
            ]}
            activeOpacity={0.85}
          >
            <Text
              style={[
                globalStyles.smallText,
                {
                  color: isSelected ? '#FFFFFF' : theme.secondaryText,
                  fontWeight: isSelected ? '600' : '500',
                },
              ]}
            >
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
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  chipActive: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
});