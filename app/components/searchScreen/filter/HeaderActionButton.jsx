import React, { useContext } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ThemeContext } from '../../../context/ThemeContext';
import { globalStyles } from '../../../../globalStyles';
export default function HeaderActionButton({
  icon,
  label,
  onPress,
  variant = 'default',
}) {
  const { theme } = useContext(ThemeContext);
  const isIconOnly = variant === 'icon';

  const getButtonStyle = () => {
    if (variant === 'clear') return [styles.clearButton];
    if (isIconOnly) return [styles.iconOnlyButton];
    return [
      styles.defaultButton,
      {
        backgroundColor: theme.cardCollectionBackground,
        borderColor: theme.border,
      },
    ];
  };

  const getTextColor = () => {
    if (variant === 'clear' || isIconOnly) return '#DC2626';
    return theme.text;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.buttonBase, ...getButtonStyle()]}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Icon
          name={icon}
          size={icon === 'close' ? 24 : 18}
          color={getTextColor()}
        />
        {!isIconOnly && (
          <Text
            style={[
              globalStyles.smallText,
              styles.text,
              { color: getTextColor() },
            ]}
          >
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
    marginTop: -3,
  },
  clearButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
  },
  defaultButton: {
    borderWidth: 1,
  },
  iconOnlyButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    marginLeft: 6,
  },
});