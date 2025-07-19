import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  Keyboard,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  RenderSearchSingleCard,
  EmptyState,
  SortingComponent,
  FilterComponent,
} from '../components/searchScreen';
import { getCardPrice } from '../utils';
import { defaultSearchCards } from '../constants';
import { searchCardsInSupabase } from '../../supabase/utils';

export default function SearchScreen() {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState([]);
  const [filters, setFilters] = useState({
    rarity: [],
    type: [],
    attack: [],
    hp: null,
    regulation: [],
    legality: [],
  });
  const [showLoader, setShowLoader] = useState(false);
  const [errorType, setErrorType] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [sortKey, setSortKey] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);
  const loaderTimeoutRef = useRef(null);
  const flatListRef = useRef(null);

  const fetchResults = useCallback(() => {
    let isCancelled = false;

    const doFetch = async () => {
      const trimmed = term.trim();
      setResults([]);
      setErrorType(null);
      setErrorMessage(null);
      clearTimeout(loaderTimeoutRef.current);
      setShowLoader(false);
      loaderTimeoutRef.current = setTimeout(() => setShowLoader(true), 200);

      try {
        const data = await searchCardsInSupabase(trimmed);

        if (!isCancelled) {
          setHasFetched(true);
          if (!data || data.length === 0) {
            setErrorType('noResults');
            setErrorMessage(`No results for “${trimmed}”.`);
          } else {
            setResults(data);
          }
        }
      } catch (e) {
        if (!isCancelled) {
          setErrorType('network');
          setErrorMessage('Unable to connect. Please try again later.');
        }
      } finally {
        if (!isCancelled) {
          clearTimeout(loaderTimeoutRef.current);
          setShowLoader(false);
        }
      }
    };

    doFetch();
    return () => {
      isCancelled = true;
    };
  }, [term]);

  useEffect(() => {
    if (flatListRef.current && filteredAndSortedResults.length > 0) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [filters, sortKey]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (term.trim()) fetchResults();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [term, fetchResults]);

  const clearSearch = () => {
    Keyboard.dismiss();
    setTerm('');
    setResults([]);
    setErrorType(null);
    setErrorMessage(null);
    setHasFetched(false);
  };

  useEffect(() => {
    setHasFetched(false);
  }, [term]);

  const retryFetch = () => fetchResults();

  const dataToSort = term.trim() ? results : defaultSearchCards;

  const sortedResults = useMemo(() => {
    if (!dataToSort.length || !sortKey) return dataToSort;

    const [base, direction = 'desc'] = sortKey.split('-');
    const isAsc = direction === 'asc';

    const getVal = item => {
      switch (base) {
        case 'name':
          return item.name?.toLowerCase() || '';
        case 'price':
          return getCardPrice(item) ?? 0;
        case 'date':
          return new Date(
            (item.set?.releaseDate || '2000/01/01').replace(/\//g, '-'),
          ).getTime();
        default:
          return '';
      }
    };

    return [...dataToSort].sort((a, b) => {
      const aVal = getVal(a);
      const bVal = getVal(b);

      if (typeof aVal === 'string') {
        return isAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return isAsc ? aVal - bVal : bVal - aVal;
    });
  }, [dataToSort, sortKey]);

  const filteredAndSortedResults = useMemo(() => {
    const baseResults = sortedResults;
    const filtered = baseResults.filter(card => {
      const matchesRarity =
        filters.rarity.length === 0 || filters.rarity.includes(card.rarity);
      const matchesType =
        filters.type.length === 0 ||
        card.types?.some(t => filters.type.includes(t));
      const matchesAttack =
        filters.attack.length === 0 ||
        (card.attacks || []).some(attack =>
          (attack.cost || []).some(costType =>
            filters.attack.includes(costType),
          ),
        );
      const hpValue = parseInt(card.hp, 10);
      const hpRange = Array.isArray(filters.hp) ? filters.hp : [0, 999];
      const matchesHp =
        Number.isFinite(hpValue) &&
        hpValue >= hpRange[0] &&
        hpValue <= hpRange[1];
      const matchesRegulation =
        filters.regulation.length === 0 ||
        (card.regulationMark &&
          filters.regulation.includes(card.regulationMark));
      const matchesLegality =
        filters.legality.length === 0 ||
        (card.legalities &&
          filters.legality.some(
            format => card.legalities[format.toLowerCase()] === 'Legal',
          ));

      return (
        matchesRarity &&
        matchesType &&
        matchesAttack &&
        matchesHp &&
        matchesRegulation &&
        matchesLegality
      );
    });

    return filtered;
  }, [sortedResults, filters]);

  const resultsCount = filteredAndSortedResults.length;

  return (
    <View style={styles.container} accessible accessibilityLabel="Search screen">
      <View style={styles.searchBar} accessible accessibilityRole="search">
        <Icon
          name="search"
          size={24}
          color="#555"
          style={styles.searchIcon}
          accessibilityLabel="Search icon"
          accessible
        />
        <TextInput
          style={styles.input}
          placeholder="Search"
          placeholderTextColor="#aaa"
          value={term}
          onChangeText={setTerm}
          returnKeyType="search"
          onSubmitEditing={() => {
            Keyboard.dismiss();
            fetchResults();
          }}
          accessibilityLabel="Search input"
          accessibilityHint="Type a keyword and press Enter to search"
        />
        {!!term && hasFetched && !showLoader && (
          <View style={styles.rightInfoContainer}>
            <Text
              style={styles.resultBadge}
              accessibilityLabel={`${resultsCount} results found`}
            >
              results: {resultsCount}
            </Text>
            <TouchableOpacity
              onPress={clearSearch}
              accessibilityLabel="Clear search input"
              accessibilityRole="button"
              style={styles.clearBtn}
            >
              <Icon name="close" size={20} color="#555" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View
        style={styles.filterSection}
        accessible
        accessibilityLabel="Filter and sorting section"
      >
        <SortingComponent setSortKey={setSortKey} sortKey={sortKey} />
        <FilterComponent filters={filters} setFilters={setFilters} />
      </View>

      {showLoader && (
        <View
          style={styles.loaderOverlay}
          accessible
          accessibilityLabel="Loading search results"
        >
          <ActivityIndicator size="large" color="#2bb060ff" />
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={filteredAndSortedResults}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <RenderSearchSingleCard item={item} />}
        numColumns={2}
        columnWrapperStyle={styles.rowWrapper}
        ListEmptyComponent={
          <EmptyState
            errorType={errorType}
            errorMessage={errorMessage}
            retryFetch={retryFetch}
          />
        }
        initialNumToRender={4}
        maxToRenderPerBatch={8}
        windowSize={5}
        contentContainerStyle={styles.listContainer}
        keyboardShouldPersistTaps="handled"
        accessibilityLabel="Search results"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  searchIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 16, paddingVertical: 4, color: '#333' },
  clearIcon: { marginLeft: 8 },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  listContainer: { flexGrow: 1, paddingBottom: 32, paddingHorizontal: 14 },
  rowWrapper: { justifyContent: 'space-between', marginBottom: 8 },
  filterSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rightInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 4,
  },
  resultBadge: {
    fontSize: 11,
    fontWeight: '300',
    color: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  clearBtn: {
    padding: 2,
  },
});