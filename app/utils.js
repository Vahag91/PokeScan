import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { OPENAI_API_KEY, POKEMON_TCG_API_KEY } from '@env';
import RNFS from 'react-native-fs';

const fetcher = url =>
  fetch(url, { headers: { 'X-Api-Key': OPENAI_API_KEY } }).then(r => r.json());

const fetcherSet = async url => {
  try {
    const res = await fetch(url, {
      headers: { 'X-Api-Key': POKEMON_TCG_API_KEY },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Fetch failed: ${res.status} — ${text}`);
    }

    const text = await res.text();
    if (!text) throw new Error('Empty response body');

    return JSON.parse(text);
  } catch (err) {
    console.error('fetcherSet error:', err.message);
    throw err;
  }
};
function getTabIcon(routeName, color, size) {
  let iconName = 'home-outline';

  if (routeName === 'Search') iconName = 'search-outline';
  else if (routeName === 'Collections') iconName = 'albums-outline';
  else if (routeName === 'Scan') iconName = 'camera-outline';
  else if (routeName === 'Helper') iconName = 'chatbubble-ellipses-outline';
  else if (routeName === 'History') iconName = 'time-outline';

  return <Ionicons name={iconName} size={size} color={color} />;
}
function Dummy() {
  return (
    <View style={styles.dummyContainer}>
      <Text style={styles.dummyText}>Coming Soon</Text>
    </View>
  );
}

function ListEmpty(loading, term) {
  if (loading) return null;
  if (term) {
    return <Text style={styles.empty}>No results</Text>;
  }
  return null;
}
const styles = StyleSheet.create({
  dummyContainer: {
    flex: 1,
    backgroundColor: '#0e0e10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dummyText: {
    color: '#fff',
  },
});
const handleImageLoad = (fadeAnim, scaleAnim) => {
  Animated.parallel([
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }),
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }),
  ]).start();
};
const categories = [
  { title: 'Destined Rivals' },
  { title: 'Journey Together' },
  { title: 'Prismatic Evolutions' },
  { title: 'Surging Sparks' },
];
function getPriceColor(label, value, tier) {
  if (!tier || !value || value === '–') return styles.defaultColor;

  const num = parseFloat(value.replace('$', ''));
  const base =
    tier.mid ??
    tier.averageSellPrice ??
    tier.avg7 ??
    tier.avg30 ??
    tier.trendPrice;

  if (!base || isNaN(num)) return styles.defaultColor;

  switch (label) {
    case 'Market Price':
    case 'Trend':
    case 'Price Trend':
      return num > base ? styles.positiveColor : styles.defaultColor;

    case 'Low Price':
      return num < base * 0.8 ? styles.negativeColor : styles.defaultColor;

    case 'High Price':
      return num > base * 1.5 ? styles.warningColor : styles.defaultColor;

    case 'Direct Low':
    case 'German Low':
      return styles.specialColor;

    default:
      return styles.defaultColor;
  }
}
function getCardPrice(item) {
  const tcgPrices = item?.tcgplayer?.prices;
  if (tcgPrices) {
    const firstKey = Object.keys(tcgPrices)[0];
    const firstFoil = tcgPrices[firstKey];
    if (firstFoil?.market != null) {
      return firstFoil.market;
    }
  }

  const cmTrend = item?.cardmarket?.prices?.trendPrice;
  if (typeof cmTrend === 'number') return cmTrend;

  return null;
}
const getContrastColor = hex => {
  const rHex = hex.substring(1, 3);
  const gHex = hex.substring(3, 5);
  const bHex = hex.substring(5, 7);

  let r = parseInt(rHex, 16) / 255;
  let g = parseInt(gHex, 16) / 255;
  let b = parseInt(bHex, 16) / 255;

  r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  return luminance > 0.7 ? '#000' : '#fff';
};
function normalizeCardFromAPI(card) {
  
  return {
    id: card.id,
    name: card.name,
    hp: card.hp ?? null,
    rarity: card.rarity ?? null,
    types: card.types ?? [],
    subtypes: card.subtypes ?? [],
    abilities: card.abilities ?? [],
    attacks: card.attacks ?? [],
    image:
      card.images?.large && typeof card.images.large === 'number'
        ? card.images.large 
        : typeof card.images?.large === 'string'
        ? card.images.large 
        : null,
    artist: card.artist ?? null,
    number: card.number ?? null,
    set: {
      name: card.set?.name ?? null,
      series: card.set?.series ?? null,
      logo:
        typeof card.set?.images?.logo === 'number'
          ? card.set.images.logo
          : typeof card.set?.images?.logo === 'string'
          ? card.set.images.logo
          : null,
      releaseDate: card.set?.releaseDate ?? null,
    },
    tcgplayer: {
      url: card.tcgplayer?.url ?? null,
      prices: card.tcgplayer?.prices ?? {},
    },
    cardmarket: {
      url: card.cardmarket?.url ?? null,
      prices: card.cardmarket?.prices ?? {},
    },
  };
}
function parseJsonSafe(value, fallback = []) {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (err) {
      console.warn('❌ Failed to parse:', value, err.message);
      return fallback;
    }
  }
  return value ?? fallback;
}
const getFullPath = filename =>
  filename ? `file://${RNFS.DocumentDirectoryPath}/${filename}` : null;

function normalizeCardFromDb(cardRow) {
  return {
    id: cardRow.cardId,
    name: cardRow.name,
    hp: cardRow.hp,
    rarity: cardRow.rarity,
    types: parseJsonSafe(cardRow.types),
    subtypes: parseJsonSafe(cardRow.subtypes),

    attacks: parseJsonSafe(cardRow.attacks),
    abilities: parseJsonSafe(cardRow.abilities),
    weaknesses: parseJsonSafe(cardRow.weaknesses),
    resistances: parseJsonSafe(cardRow.resistances),
    retreatCost: parseJsonSafe(cardRow.retreatCost),

    artist: cardRow.artist,
    flavorText: cardRow.flavorText ?? null,
    number: cardRow.number,

    set: {
      name: cardRow.setName,
      series: cardRow.seriesName,
      logo: getFullPath(cardRow.setLogo),
      releaseDate: cardRow.releaseDate,
    },
    image: getFullPath(cardRow.imagePath),
    tcgplayer: {
      url: cardRow.tcgplayerUrl ?? null,
      prices: parseJsonSafe(cardRow.tcgplayerPrices, {}),
    },

    cardmarket: {
      url: cardRow.cardmarketUrl ?? null,
      prices: parseJsonSafe(cardRow.cardmarketPrices, {}),
    },
  };
}

export {
  getTabIcon,
  Dummy,
  categories,
  handleImageLoad,
  fetcher,
  ListEmpty,
  getPriceColor,
  getCardPrice,
  getContrastColor,
  normalizeCardFromAPI,
  normalizeCardFromDb,
  getFullPath,
  fetcherSet,
};


// import React from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   Dimensions,
//   TouchableOpacity,
// } from 'react-native';
// import { useRoute, useNavigation } from '@react-navigation/native';
// import SkeletonCard from '../components/skeletons/SkeleteonCard';
// import useSWR from 'swr';
// import { fetcherSet } from '../utils';
// import { Image } from 'react-native';
// const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2;

// const MemoizedCardItem = React.memo(({ item, onPress }) => (
//   <TouchableOpacity
//     style={styles.cardContainer}
//     onPress={() => onPress(item.id)}
//   >
//     <Image source={{ uri: item.images.small }} style={styles.card} />
//   </TouchableOpacity>
// ));

// export default function SetDetailScreen() {
//   const route = useRoute();
//   const navigation = useNavigation();
//   const { setId } = route.params;

//   const { data, error, isLoading } = useSWR(
//     `https://api.pokemontcg.io/v2/cards?q=set.id:${setId}`,
//     fetcherSet
//   );

//   const cards = data?.data || [];

//   const renderItem = ({ item }) => (
//     <MemoizedCardItem
//       item={item}
//       onPress={(id) => navigation.navigate('SingleCardScreen', { cardId: id })}
//     />
//   );

//   if (isLoading) {
//     return (
//       <View style={styles.container}>
//         <Text style={styles.title}>Loading cards...</Text>
//         <FlatList
//           data={Array.from({ length: 6 })}
//           keyExtractor={(_, index) => index.toString()}
//           numColumns={2}
//           renderItem={() => (
//             <View style={styles.cardContainer}>
//               <SkeletonCard />
//             </View>
//           )}
//         />
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={styles.centered}>
//         <Text>Error loading cards.</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Cards in Set</Text>
//       <FlatList
//         data={cards}
//         keyExtractor={(item) => item.id}
//         renderItem={renderItem}
//         numColumns={2}
//         contentContainerStyle={styles.grid}
//         showsVerticalScrollIndicator={false}
//         initialNumToRender={12}
//         maxToRenderPerBatch={12}
//         windowSize={5}
//         removeClippedSubviews={true}
//         getItemLayout={(data, index) => ({
//           length: CARD_WIDTH * 1.4 + 16,
//           offset: (CARD_WIDTH * 1.4 + 16) * Math.floor(index / 2),
//           index,
//         })}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingHorizontal: 16,
//     paddingTop: 16,
//     backgroundColor: '#FFFFFF',
//   },
//   grid: {
//     paddingBottom: 80,
//   },
//   title: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginBottom: 16,
//     textAlign: 'center',
//   },
//   cardContainer: {
//     width: CARD_WIDTH,
//     marginBottom: 16,
//     marginRight: 16,
//   },
//   card: {
//     width: '100%',
//     height: CARD_WIDTH * 1.4,
//     resizeMode: 'contain',
//     borderRadius: 8,
//     backgroundColor: '#f5f5f5',
//   },
//   centered: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
// });