
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { FasterImageView } from '@rraut/react-native-faster-image';

export default function EvolutionChain({ title, cards, onCardPress }) {
  if (!cards?.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {cards.map(card => (
          <TouchableOpacity
            key={card.id}
            onPress={() => onCardPress(card.id)}
            style={styles.item}
          >
            <FasterImageView source={{ uri: card.images.small }} style={styles.image} />
            <Text style={styles.name}>{card.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 10 },
  header: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
    marginBottom: 4,
    color: '#444',
  },
  item: {
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 4,
  },
  image: { width: 80, height: 112, borderRadius: 8 },
  name: { marginTop: 4, fontSize: 12, color: '#333' },
});
