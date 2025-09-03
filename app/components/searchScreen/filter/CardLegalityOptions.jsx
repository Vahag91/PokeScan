import React, { useContext } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../../../context/ThemeContext';
import { globalStyles } from '../../../../globalStyles';

export default function CardLegalityOptions({ selected, setSelected }) {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);

  const LEGALITY_OPTIONS = [
    { key: 'Standard', label: t('search.legality.standard') },
    { key: 'Expanded', label: t('search.legality.expanded') },
    { key: 'Unlimited', label: t('search.legality.unlimited') }
  ];

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
        const isSelected = selected.includes(option.key);
        return (
          <TouchableOpacity
            key={option.key}
            onPress={() => toggle(option.key)}
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
              {option.label}
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