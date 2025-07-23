import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';
import { globalStyles } from '../../../globalStyles';
export default function LabelRow({ label, value, subtext }) {
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  return (
    <View style={styles.row}>
      <View style={styles.labelBox}>
        {typeof label === 'string' ? (
          <Text style={[globalStyles.body, styles.label]}>{label}</Text>
        ) : (
          label
        )}
        {subtext && (
          <Text style={[globalStyles.smallText, styles.subLabel]}>{subtext}</Text>
        )}
      </View>
      <Text style={[globalStyles.body, styles.value]}>{value}</Text>
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: 6,
    },
    labelBox: {
      flex: 1,
      marginRight: 10,
    },
    label: {
      color: theme.text,
    },
    subLabel: {
      color: theme.mutedText,
      marginTop: 2,
    },
    value: {
      color: theme.text,
    },
  });