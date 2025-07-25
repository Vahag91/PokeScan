import React, { useContext, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import AnimatedCard from './AnimatedCard';
import { ThemeContext } from '../../context/ThemeContext';

export default function AnimatedRow({ itemPair, index, onPress, setStats }) {
  const { theme } = useContext(ThemeContext);

  const styles = useMemo(() => StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
      paddingHorizontal: 16,
      marginTop: 8,
    },
    cardPlaceholder: {
      width: '48%',
      backgroundColor: theme.background,
    },
  }), [theme]);

  return (
    <View style={styles.row}>
      <AnimatedCard
        item={itemPair[0]}
        delay={index * 60}
        onPress={onPress}
        setStats={setStats}
      />
      {itemPair[1] ? (
        <AnimatedCard
          item={itemPair[1]}
          delay={index * 60 + 30}
          onPress={onPress}
          setStats={setStats}
        />
      ) : (
        <View style={styles.cardPlaceholder} />
      )}
    </View>
  );
}