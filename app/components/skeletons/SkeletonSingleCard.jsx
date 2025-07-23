import React, { useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';
export default function SkeletonSingleCard() {
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.cardName} />

      <View style={styles.imageWrapper}>
        <View style={styles.cardImage} />
      </View>

      <View style={styles.sectionBox}>
        <View style={styles.labelRow} />
        <View style={styles.subText} />
      </View>

      <View style={styles.sectionBox}>
        <View style={styles.titleLine} />
        <View style={styles.labelRow} />
        <View style={styles.labelRow} />
      </View>

      <View style={styles.sectionBox}>
        <View style={styles.labelRow} />
        <View style={styles.labelRow} />
      </View>

      <View style={styles.sectionBox}>
        <View style={styles.titleLine} />
        <View style={styles.labelRow} />
        <View style={styles.labelRow} />
        <View style={styles.labelRow} />
        <View style={styles.labelRow} />
        <View style={styles.labelRow} />
      </View>
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: theme.background,
    },
    cardName: {
      height: 24,
      width: '60%',
      backgroundColor: theme.border,
      borderRadius: 6,
      alignSelf: 'center',
      marginBottom: 12,
    },
    imageWrapper: {
      alignItems: 'center',
      marginBottom: 24,
    },
    cardImage: {
      width: '85%',
      height: 340,
      backgroundColor: theme.border,
      borderRadius: 16,
    },
    sectionBox: {
      backgroundColor: theme.inputBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    labelRow: {
      height: 18,
      backgroundColor: theme.border,
      borderRadius: 6,
      marginBottom: 12,
      width: '100%',
    },
    subText: {
      height: 12,
      width: '60%',
      backgroundColor: theme.placeholder,
      borderRadius: 6,
      marginTop: 6,
    },
    titleLine: {
      height: 20,
      width: '30%',
      backgroundColor: theme.secondaryText,
      borderRadius: 6,
      marginBottom: 14,
    },
  });