import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemeContext } from '../../../context/ThemeContext';
import { globalStyles } from '../../../../globalStyles';
const REGULATION_MARKS = ['D', 'E', 'F', 'G', 'H'];

export default function RegulationMarkOptions({ selected, setSelected }) {
  const { theme } = useContext(ThemeContext);

  const toggle = mark => {
    setSelected(prev =>
      prev.includes(mark) ? prev.filter(m => m !== mark) : [...prev, mark]
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
            style={[
              styles.badge,
              {
                backgroundColor: theme.cardCollectionBackground,
                borderColor: isSelected ? '#10B981' : theme.border,
                borderWidth: isSelected ? 1.2 : 1,
              },
            ]}
            activeOpacity={0.85}
          >
            <Text
              style={[
                globalStyles.body,
                styles.text,
                { color: isSelected ? theme.text : theme.secondaryText },
              ]}
            >
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
  },
});