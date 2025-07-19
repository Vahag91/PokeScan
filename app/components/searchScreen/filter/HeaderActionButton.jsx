import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function HeaderActionButton({
  icon,
  label,
  onPress,
  variant = 'default',
}) {
  const isIconOnly = variant === 'icon';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.buttonBase,
        variant === 'clear' ? styles.clearButton : styles.defaultButton,
        isIconOnly && styles.iconOnlyButton,
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Icon
          name={icon}
          size={icon === 'close' ? 24 : 18}
          color={variant === 'clear' || isIconOnly ? '#DC2626' : '#1E293B'}
        />
        {!isIconOnly && (
          <Text style={[styles.text, variant === 'clear' && styles.clearText]}>
            {label}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    marginTop:-3
  },
  defaultButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  clearButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  iconOnlyButton: {
    padding: 6,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 6,
  },
  clearText: {
    color: '#DC2626',
  },
});
