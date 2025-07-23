import React, { useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { FasterImageView } from '@rraut/react-native-faster-image';
import { ThemeContext } from '../../context/ThemeContext';
import { globalStyles } from '../../../globalStyles';
export default function EvolutionChain({ title, cards, onCardPress }) {
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  if (!cards?.length) return null;

  return (
    <View style={styles.container}>
      <Text style={[globalStyles.subheading, styles.header]}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {cards.map(card => (
          <TouchableOpacity
            key={card.id}
            onPress={() => onCardPress(card.id)}
            style={styles.item}
          >
            <FasterImageView source={{ uri: card.images.small }} style={styles.image} />
            <Text style={[globalStyles.smallText, styles.name]}>{card.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: { marginVertical: 10 },
    header: {
      marginLeft: 4,
      marginBottom: 4,
      color: theme.text,
    },
    item: {
      alignItems: 'center',
      marginRight: 12,
      backgroundColor: theme.inputBackground,
      borderRadius: 8,
      padding: 4,
    },
    image: {
      width: 80,
      height: 112,
      borderRadius: 8,
    },
    name: {
      marginTop: 4,
      color: theme.text,
    },
  });