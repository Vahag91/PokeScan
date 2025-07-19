import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import SkeletonCard from '../components/skeletons/SkeleteonCard';
import { RenderSearchSingleCard } from '../components/searchScreen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { supabase } from '../../supabase/supabase';

const CARD_SPACING = 12;
const CARD_WIDTH = (Dimensions.get('window').width - CARD_SPACING * 3) / 2;

export default function SetDetailScreen() {
  const route = useRoute();
  const { setId } = route.params;

  const [sortAsc, setSortAsc] = useState(true);
  const [cards, setCards] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const flatListRef = useRef(null);
  const scrollTopOpacity = useRef(new Animated.Value(0)).current;

  const fetchCards = async () => {
    if (isFetching) return;
    setIsFetching(true);

    try {
      const { data } = await supabase
        .from('cards')
        .select('*')
        .filter('set->>id', 'eq', setId);

      if (error) throw error;

      const sorted = [...data].sort((a, b) => {
        const aNum = parseInt(a.number, 10);
        const bNum = parseInt(b.number, 10);

        if (isNaN(aNum) || isNaN(bNum)) {
          return sortAsc
            ? a.number.localeCompare(b.number)
            : b.number.localeCompare(a.number);
        }

        return sortAsc ? aNum - bNum : bNum - aNum;
      });

      setCards(sorted);
    } catch (err) {
      console.error('Failed to fetch cards:', err.message);
      setError(err);
    } finally {
      setIsFetching(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    setCards([]);
    setInitialLoading(true);
    fetchCards();
  }, [setId, sortAsc]);

  const toggleSort = () => setSortAsc(prev => !prev);

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
  };

  const handleScroll = event => {
    const offsetY = event.nativeEvent.contentOffset.y;
    Animated.timing(scrollTopOpacity, {
      toValue: offsetY > 300 ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const renderItem = ({ item }) => (
    <RenderSearchSingleCard item={item} showCardNumber />
  );

  const renderHeader = () => {
    const setName = cards?.[0]?.set?.name || 'Cards in Set';
    return (
      <View style={styles.header}>
        <Text style={styles.title}>{setName}</Text>
        <TouchableOpacity onPress={toggleSort} style={styles.sortButton}>
          <View style={styles.sortButtonInner}>
            <Ionicons
              name={sortAsc ? 'arrow-down' : 'arrow-up'}
              size={16}
              color="#4B5563"
            />
            <Text style={styles.sortText}>
              {sortAsc ? 'Low to High' : 'High to Low'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFooter = () =>
    isFetching ? (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#10B981" />
      </View>
    ) : null;

  if (initialLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading cards...</Text>
        <FlatList
          data={Array.from({ length: 8 })}
          keyExtractor={(_, index) => `skeleton-${index}`}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          renderItem={() => (
            <View style={styles.cardContainer}>
              <SkeletonCard />
            </View>
          )}
        />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text>Error loading cards.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={cards}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
      />
      <Animated.View
        style={[styles.scrollTopButton, { opacity: scrollTopOpacity }]}
      >
        <TouchableOpacity onPress={scrollToTop}>
          <Ionicons name="chevron-up" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  grid: {
    paddingBottom: 80,
    paddingHorizontal: CARD_SPACING,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  header: {
    paddingTop: 24,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  sortButton: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  sortButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  sortText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 6,
    fontWeight: '500',
  },
  cardContainer: {
    width: CARD_WIDTH,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  footer: {
    paddingVertical: 24,
  },
  scrollTopButton: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
});
