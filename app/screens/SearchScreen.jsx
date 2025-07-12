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
} from 'react-native';
import { POKEMON_TCG_API_KEY } from '@env';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  RenderSearchSingleCard,
  EmptyState,
  SortingComponent,
  FilterComponent,
} from '../components/searchScreen';
import { getCardPrice } from '../utils';
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
  const loaderTimeoutRef = useRef(null);
  const flatListRef = useRef(null);
  const isValidInput = input => /^[\p{L}\p{N} ':.-]+$/u.test(input.trim());

  const fetchResults = useCallback(() => {
    let isCancelled = false;

    const doFetch = async () => {
      const trimmed = term.trim();
      setResults([]);
      setErrorType(null);
      setErrorMessage(null);

      if (!trimmed) return;
      if (!isValidInput(trimmed)) {
        setErrorType('invalidInput');
        setErrorMessage('Please use only Latin letters and numbers.');
        return;
      }

      clearTimeout(loaderTimeoutRef.current);
      setShowLoader(false);
      loaderTimeoutRef.current = setTimeout(() => setShowLoader(true), 200);

      try {
        // Build a single wildcard query on the name field,
        // so "koraidon ex" becomes name:*koraidon*ex*
        const cleaned = trimmed.replace(/[^\w\s]/g, '');
        const pattern = cleaned.split(/\s+/).join('*') + '*';
        const esQuery = `name:*${pattern}`;

        const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(
          esQuery,
        )}`;
        const res = await fetch(url, {
          headers: { 'X-Api-Key': POKEMON_TCG_API_KEY },
        });
        if (!res.ok) throw new Error('Network response was not ok');
        const { data } = await res.json();

        if (!isCancelled) {
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
  };

  const retryFetch = () => fetchResults();
  const sortedResults = useMemo(() => {
    if (!results.length || !sortKey) return results;

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

    return [...results].sort((a, b) => {
      const aVal = getVal(a);
      const bVal = getVal(b);

      if (typeof aVal === 'string') {
        return isAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return isAsc ? aVal - bVal : bVal - aVal;
    });
  }, [results, sortKey]);

  const filteredAndSortedResults = useMemo(() => {
    const filtered = sortedResults.filter(card => {
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
      const matchesHp =
        filters.hp?.length !== 2 ||
        (Number.isFinite(hpValue) &&
          hpValue >= filters.hp[0] &&
          hpValue <= filters.hp[1]);
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

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
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
        />
        {!!term && (
          <TouchableOpacity
            onPress={clearSearch}
            style={styles.clearIcon}
            accessibilityLabel="Clear search input"
            accessibilityRole="button"
            accessible
          >
            <Icon name="close" size={20} color="#555" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterSection}>
        <SortingComponent setSortKey={setSortKey} sortKey={sortKey} />
        <FilterComponent filters={filters} setFilters={setFilters} />
      </View>

      {showLoader && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
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
});
