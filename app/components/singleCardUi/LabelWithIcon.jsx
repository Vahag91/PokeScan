import React, { useContext } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { typeIcons } from '../../constants';
import { ThemeContext } from '../../context/ThemeContext';
import { globalStyles } from '../../../globalStyles';
export default function LabelWithIcon({ types, text }) {
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  return (
    <View style={styles.iconRow}>
      {types?.map((type, i) => {
        const iconSource = typeIcons[type];
        return iconSource ? (
          <Image
            key={i}
            source={iconSource}
            style={styles.iconImage}
            resizeMode="contain"
          />
        ) : null;
      })}
      <Text style={[globalStyles.body, styles.labelText]}>{text}</Text>
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    iconRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconImage: {
      width: 18,
      height: 18,
      marginRight: 4,
    },
    labelText: {
      color: theme.text,
    },
  });