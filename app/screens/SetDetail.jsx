import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import SkeletonCard from '../components/skeletons/SkeleteonCard';
import useSWR from 'swr';
import { fetcher } from '../utils';

const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2;

// const API_KEY = '96b19782-71f8-4f2d-b594-92674f19363d';
// const fetcher = url =>
//   fetch(url, {
//     headers: { 'X-Api-Key': API_KEY },
//   }).then(res => res.json());

export default function SetDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { setId } = route.params;

  const { data, error, isLoading } = useSWR(
    `https://api.pokemontcg.io/v2/cards?q=set.id:${setId}`,
    fetcher
  );

  if (isLoading) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Loading cards...</Text>
        {Array.from({ length: 4 }).map((_, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ))}
      </ScrollView>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text>Error loading cards.</Text>
      </View>
    );
  }

  const cards = data?.data || [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Cards in Set</Text>
      {Array.from({ length: Math.ceil(cards.length / 2) }).map((_, rowIndex) => {
        const first = cards[rowIndex * 2];
        const second = cards[rowIndex * 2 + 1];

        return (
          <View key={rowIndex} style={styles.row}>
            <TouchableOpacity onPress={() => navigation.navigate('SingleCardScreen', { cardId: first.id })}>
              <Image source={{ uri: first.images.small }} style={styles.card} />
            </TouchableOpacity>
            {second && (
              <TouchableOpacity onPress={() => navigation.navigate('SingleCardScreen', { cardId: second.id })}>
                <Image source={{ uri: second.images.small }} style={styles.card} />
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 80,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.4,
    resizeMode: 'contain',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  skeleton: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.4,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    opacity: 0.3,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
