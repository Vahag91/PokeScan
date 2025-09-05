import React, { useContext } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';
import { globalStyles } from '../../../globalStyles';

export default function SetLabelRow({ set }) {
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  if (!set?.name) return null;

  const logoSource =
    typeof set.logo === 'number'
      ? set.logo
      : set.logo
      ? { uri: set.logo }
      : null;

  return (
    <View style={styles.row}>
      <Text style={[globalStyles.body, styles.label, { color: theme.secondaryText }]}>
        Set
      </Text>
      <View style={styles.valueWrapper}>
        {logoSource && <Image source={logoSource} style={styles.logo} />}
        <Text
          style={[globalStyles.body, styles.name, { color: theme.text }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {set.name}
        </Text>
      </View>
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      marginBottom: 6,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    label: {
      width: '30%',
    },
    valueWrapper: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      maxWidth: '70%',
      flex: 1,
      marginLeft: 8,
    },
    logo: {
      width: 40,
      height: 20,
      resizeMode: 'contain',
      marginRight: 6,
    },
    name: {
      flexShrink: 1,
    },
  });