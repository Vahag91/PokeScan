import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../../../context/ThemeContext';

export default function SupertypeOptions({ selected, setSelected }) {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);

  const supertypes = [
    { label: t('search.supertype.pokemon'), icon: 'pokeball' },
    { label: t('search.supertype.trainer'), icon: 'account-tie' },
    { label: t('search.supertype.energy'), icon: 'flash' },
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
      {supertypes.map(({ label, icon }) => {
        const active = selected.includes(label);
        return (
          <TouchableOpacity
            key={label}
            onPress={() => toggle(label)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? '#10B981' : theme.cardCollectionBackground,
                shadowColor: active ? '#000' : 'transparent',
                shadowOpacity: active ? 0.1 : 0,
                elevation: active ? 2 : 0,
              },
            ]}
            activeOpacity={0.85}
          >
            <View style={styles.content}>
              <Icon
                name={icon}
                size={16}
                color={active ? '#fff' : theme.secondaryText}
                style={styles.icon}
              />
              <Text
                style={[
                  styles.text,
                  {
                    color: active ? '#fff' : theme.secondaryText,
                    fontWeight: active ? '600' : '500',
                  },
                ]}
              >
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
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
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
  },
});