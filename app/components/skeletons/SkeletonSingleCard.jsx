import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function SkeletonSingleCard() {
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

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  cardName: {
    height: 24,
    width: '60%',
    backgroundColor: '#e0e0e0',
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
    backgroundColor: '#ddd',
    borderRadius: 16,
  },
  sectionBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  labelRow: {
    height: 18,
    backgroundColor: '#e4e4e4',
    borderRadius: 6,
    marginBottom: 12,
    width: '100%',
  },
  subText: {
    height: 12,
    width: '60%',
    backgroundColor: '#eee',
    borderRadius: 6,
    marginTop: 6,
  },
  titleLine: {
    height: 20,
    width: '30%',
    backgroundColor: '#ccc',
    borderRadius: 6,
    marginBottom: 14,
  },
});
