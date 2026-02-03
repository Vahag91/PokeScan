// SetDetailScreen.js (optimized, NO react-native-fast-image)
import React, { useRef, useState, useContext, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';

import SkeletonCard from '../components/skeletons/SkeleteonCard';
import SetHeaderSkeleton from '../components/skeletons/SetHeaderSkeleton';
import { RenderSearchSingleCard } from '../components/searchScreen';
import { globalStyles } from '../../globalStyles';
import SetHeader from '../components/setSearch/SetHeader';
import { ThemeContext } from '../context/ThemeContext';
import ErrorView from '../components/ErrorView';
import { fetchEnglishSetCards, fetchJapaneseSetCards } from '../../supabase/utils';

const CARD_SPACING = 12;
const CARD_WIDTH = (Dimensions.get('window').width - CARD_SPACING * 3) / 2;
const PAGE_SIZE = 40;

// -------------------- helpers --------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function prefetchWithConcurrency(urls, concurrency = 3) {
  const list = (urls || []).filter(Boolean);
  if (!list.length) return;

  let i = 0;
  const workers = Array.from({ length: Math.min(concurrency, list.length) }).map(async () => {
    while (i < list.length) {
      const url = list[i++];
      try {
        await Image.prefetch(url);
      } catch (e) {
        // ignore
      }
      // pacing is important on slow networks
      await sleep(50);
    }
  });

  await Promise.all(workers);
}

export default function SetDetailScreen() {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();
  const route = useRoute();
  const { setId, language = 'en', setMeta } = route.params;

  const requestIdRef = useRef(0);
  const [sortAsc, setSortAsc] = useState(true);
  const flatListRef = useRef(null);
  const scrollTopOpacity = useRef(new Animated.Value(0)).current;

  const [cards, setCards] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const isRetryable = useCallback((err) => {
    const message = String(err?.message || '').toLowerCase();
    return (
      message.includes('statement timeout') ||
      message.includes('socket hang up') ||
      message.includes('network request failed')
    );
  }, []);

  const runWithRetries = useCallback(
    async (fn, { retries = 2, retryDelay = 400 } = {}) => {
      let attempt = 0;
      while (attempt <= retries) {
        try {
          return await fn();
        } catch (e) {
          const canRetry = attempt < retries && isRetryable(e);
          console.warn('[SetDetail] fetch attempt failed', {
            attempt,
            canRetry,
            message: e?.message,
          });
          if (!canRetry) throw e;
          attempt += 1;
          await sleep(retryDelay);
        }
      }
    },
    [isRetryable],
  );

  const fetchPage = useCallback(
    async (offset) => {
      console.info('[SetDetail] fetching set cards page', { setId, language, offset, limit: PAGE_SIZE });
      const options = { offset, limit: PAGE_SIZE, includeMarket: true };
      if (language === 'en') return await fetchEnglishSetCards(setId, options);
      return await fetchJapaneseSetCards(setId, options);
    },
    [setId, language],
  );

  const loadInitial = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setInitialLoading(true);
    setLoadingMore(false);
    setError(null);
    setHasMore(true);

    try {
      const firstPage = await runWithRetries(() => fetchPage(0));
      if (requestId !== requestIdRef.current) return;
      const safe = Array.isArray(firstPage) ? firstPage : [];
      setCards(safe);
      setHasMore(safe.length === PAGE_SIZE);
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      setCards([]);
      setError(e);
    } finally {
      if (requestId !== requestIdRef.current) return;
      setInitialLoading(false);
    }
  }, [fetchPage, runWithRetries]);

  const loadMore = useCallback(async () => {
    if (initialLoading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const offset = cards.length;

    try {
      const nextPage = await runWithRetries(() => fetchPage(offset), { retries: 1, retryDelay: 500 });
      const safe = Array.isArray(nextPage) ? nextPage : [];
      setCards((prev) => {
        const prevIds = new Set(prev.map((c) => c?.id).filter(Boolean));
        const merged = [...prev];
        for (const card of safe) {
          if (!card?.id || prevIds.has(card.id)) continue;
          prevIds.add(card.id);
          merged.push(card);
        }
        return merged;
      });
      setHasMore(safe.length === PAGE_SIZE);
    } catch (e) {
      console.error('[SetDetail] failed to load more cards', { setId, language, offset, message: e?.message });
      // keep existing cards; user can scroll/try again
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [cards.length, fetchPage, hasMore, initialLoading, language, loadingMore, runWithRetries, setId]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // ✅ Prefetch only FIRST screen thumbnails (keeps bandwidth sane on slow internet)
  useEffect(() => {
    if (!Array.isArray(cards) || cards.length === 0) return;

    const firstBatch = cards
      .slice(0, 16) // 8 items = 4 rows; 16 items = 8 rows (pick what feels best)
      .map((c) => c?.images?.small || c?.images?.thumb || c?.images?.url)
      .filter(Boolean);

    (async () => {
      try {
        await prefetchWithConcurrency(firstBatch, 3);
      } catch (e) {}
    })();
  }, [cards]);

  // ✅ sorting (stable + guarded)
  const sortedCards = useMemo(() => {
    if (!Array.isArray(cards)) return [];

    return [...cards].sort((a, b) => {
      const aNum = parseInt(a?.number, 10);
      const bNum = parseInt(b?.number, 10);

      if (isNaN(aNum) || isNaN(bNum)) {
        const an = a?.number || '';
        const bn = b?.number || '';
        return sortAsc ? an.localeCompare(bn) : bn.localeCompare(an);
      }
      return sortAsc ? aNum - bNum : bNum - aNum;
    });
  }, [cards, sortAsc]);

  const toggleSort = () => setSortAsc((prev) => !prev);
  const scrollToTop = () => flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    Animated.timing(scrollTopOpacity, {
      toValue: offsetY > 300 ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  // ✅ renderItem memoized
  const renderItem = useCallback(
    ({ item }) => (
      <RenderSearchSingleCard
        item={item}
        showCardNumber
        selectedLanguage={language}
        imageProps={Platform.OS === 'android' ? { fadeDuration: 0 } : null}
      />
    ),
    [language]
  );

  const renderHeader = useCallback(
    () => (
      <View>
        <SetHeader cards={cards} setMeta={setMeta} />
        <TouchableOpacity onPress={toggleSort} style={styles.sortButton}>
          <View style={styles.sortButtonInner}>
            <Ionicons name={sortAsc ? 'arrow-down' : 'arrow-up'} size={16} color={theme.secondaryText} />
            <Text style={[globalStyles.smallText, styles.sortText, { color: theme.secondaryText }]}>
              {sortAsc ? t('sets.sortLowToHigh') : t('sets.sortHighToLow')}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    ),
    [cards, setMeta, sortAsc, theme.secondaryText, t]
  );

  const renderFooter = useCallback(
    () =>
      loadingMore ? (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color={theme.accent} />
        </View>
      ) : null,
    [loadingMore, theme.accent]
  );

  if (initialLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {setMeta ? <SetHeader cards={[]} setMeta={setMeta} /> : <SetHeaderSkeleton />}
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
          // keep skeleton light
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={3}
          removeClippedSubviews
        />
      </View>
    );
  }

  if (error) return <ErrorView message={t('sets.errorLoadingCards')} onRetry={loadInitial} />;
  if (!initialLoading && !error && sortedCards.length === 0) {
    return <ErrorView message={t('sets.noCardsInSet')} onRetry={loadInitial} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        ref={flatListRef}
        data={sortedCards}
        keyExtractor={(item) => item.id} // ✅ avoid index keys
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        // ✅ list tuning (reduces work + image burst downloads)
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        updateCellsBatchingPeriod={80}
        windowSize={5}
        removeClippedSubviews
        // ✅ helps keep frames smooth
        getItemLayout={(_, index) => {
          // If your card height is known, set it here for a BIG win.
          // If unknown, remove getItemLayout.
          const ITEM_HEIGHT = 290; // <-- adjust to your card height
          const rowIndex = Math.floor(index / 2);
          return { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * rowIndex, index };
        }}
      />

      <Animated.View style={[styles.scrollTopButton, { opacity: scrollTopOpacity, backgroundColor: theme.accent }]}>
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
  sortButton: { alignSelf: 'center' },
  sortButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  sortText: { marginLeft: 6 },
  cardContainer: { width: CARD_WIDTH },
  footer: { paddingVertical: 24 },
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
