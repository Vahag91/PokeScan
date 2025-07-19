import React from 'react';
import { View, StyleSheet } from 'react-native';
import AnimatedCard from './AnimatedCard';

export default function AnimatedRow({ itemPair, index, onPress }) {
  return (
    <View style={styles.row}>
      <AnimatedCard
        item={itemPair[0]}
        delay={index * 60}
        onPress={onPress}
      />
      {itemPair[1] ? (
        <AnimatedCard
          item={itemPair[1]}
          delay={index * 60 + 30}
          onPress={onPress}
        />
      ) : (
        <View style={styles.cardPlaceholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  cardPlaceholder: {
    width: '48%',
    backgroundColor: 'transparent',
    elevation: 0,
  },
});
