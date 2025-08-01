import React, {
  useRef,
  useState,
  useContext,
  useCallback,
  useMemo,
} from 'react';
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
import SetHeaderSkeleton from '../components/skeletons/SetHeaderSkeleton';
import { RenderSearchSingleCard } from '../components/searchScreen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { supabase } from '../../supabase/supabase';
import { globalStyles } from '../../globalStyles';
import SetHeader from '../components/setSearch/SetHeader';
import { ThemeContext } from '../context/ThemeContext';
import useSafeAsync from '../hooks/useSafeAsync';
import ErrorView from '../components/ErrorView';

const CARD_SPACING = 12;
const CARD_WIDTH = (Dimensions.get('window').width - CARD_SPACING * 3) / 2;

export default function SetDetailScreen() {
  const { theme } = useContext(ThemeContext);
  const route = useRoute();
  const { setId } = route.params;

  const [sortAsc, setSortAsc] = useState(true);
  const flatListRef = useRef(null);
  const scrollTopOpacity = useRef(new Animated.Value(0)).current;

  // ✅ Stable fetch function
  const fetchCards = useCallback(async () => {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .filter('set->>id', 'eq', setId);

    if (error) throw error;
    return data || [];
  }, [setId]);

  // ✅ Safe async logic
  const { data: cards = [], loading, error, retry } = useSafeAsync(fetchCards);

  // ✅ Safe and guarded sorting
  const sortedCards = useMemo(() => {
    if (!Array.isArray(cards)) return [];

    return [...cards].sort((a, b) => {
      const aNum = parseInt(a?.number, 10);
      const bNum = parseInt(b?.number, 10);

      if (isNaN(aNum) || isNaN(bNum)) {
        return sortAsc
          ? a?.number?.localeCompare(b?.number || '') || 0
          : b?.number?.localeCompare(a?.number || '') || 0;
      }

      return sortAsc ? aNum - bNum : bNum - aNum;
    });
  }, [cards, sortAsc]);

  const toggleSort = () => setSortAsc(prev => !prev);

  const scrollToTop = () =>
    flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });

  const handleScroll = event => {
    const offsetY = event.nativeEvent.contentOffset.y;
    Animated.timing(scrollTopOpacity, {
      toValue: offsetY > 300 ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const renderItem = useCallback(
    ({ item }) => <RenderSearchSingleCard item={item} showCardNumber />,
    [],
  );

  const renderHeader = () => (
    <View>
      <SetHeader cards={cards} />
      <TouchableOpacity onPress={toggleSort} style={styles.sortButton}>
        <View style={styles.sortButtonInner}>
          <Ionicons
            name={sortAsc ? 'arrow-down' : 'arrow-up'}
            size={16}
            color={theme.secondaryText}
          />
          <Text
            style={[
              globalStyles.smallText,
              styles.sortText,
              { color: theme.secondaryText },
            ]}
          >
            {sortAsc ? 'Low to High' : 'High to Low'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () =>
    loading ? (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={theme.accent} />
      </View>
    ) : null;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SetHeaderSkeleton />
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
    return <ErrorView message="Error loading cards." onRetry={retry} />;
  }
  if (!loading && !error && cards.length === 0) {
    return <ErrorView message="No cards found in this set." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        ref={flatListRef}
        data={sortedCards}
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
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
      <Animated.View
        style={[
          styles.scrollTopButton,
          {
            opacity: scrollTopOpacity,
            backgroundColor: theme.accent,
          },
        ]}
      >
        <TouchableOpacity onPress={scrollToTop}>
          <Ionicons name="chevron-up" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  grid: {
    paddingBottom: 80,
    paddingHorizontal: CARD_SPACING,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sortButton: {
    alignSelf: 'center',
  },
  sortButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  sortText: {
    marginLeft: 6,
  },
  cardContainer: {
    width: CARD_WIDTH,
  },
  footer: {
    paddingVertical: 24,
  },
  scrollTopButton: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    padding: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
});
