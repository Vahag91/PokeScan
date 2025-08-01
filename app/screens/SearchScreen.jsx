import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useContext,
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
import { ThemeContext } from '../context/ThemeContext';
import { globalStyles } from '../../globalStyles';

export default function SearchScreen() {
  const { theme } = useContext(ThemeContext);
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
      if (!trimmed) return;

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
    const delayDebounce = setTimeout(() => {
      if (term.trim()) fetchResults();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [term, fetchResults]);

  useEffect(() => {
    setHasFetched(false);
  }, [term]);

  useEffect(() => {
    if (flatListRef.current && filteredAndSortedResults.length > 0) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [filters, sortKey]);

  const clearSearch = () => {
    Keyboard.dismiss();
    setTerm('');
    setResults([]);
    setErrorType(null);
    setErrorMessage(null);
    setHasFetched(false);
  };

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
      return typeof aVal === 'string'
        ? isAsc
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
        : isAsc
        ? aVal - bVal
        : bVal - aVal;
    });
  }, [dataToSort, sortKey]);

  const filteredAndSortedResults = useMemo(() => {
    return sortedResults.filter(card => {
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
  }, [sortedResults, filters]);

  const resultsCount = filteredAndSortedResults.length;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: theme.inputBackground,
            borderColor: theme.border,
            shadowColor: theme.text,
          },
        ]}
      >
        <Icon name="search" size={24} color={theme.mutedText} style={styles.searchIcon} />
        <TextInput
          style={[globalStyles.body, styles.input, { color: theme.text }]}
          placeholder="Search"
          placeholderTextColor={theme.placeholder}
          value={term}
          onChangeText={setTerm}
          returnKeyType="search"
          onSubmitEditing={() => {
            Keyboard.dismiss();
            if (term.trim()) fetchResults();
          }}
        />
        {!!term && hasFetched && !showLoader && (
          <View style={styles.rightInfoContainer}>
            <Text style={[globalStyles.smallText, styles.resultBadge, { color: theme.secondaryText }]}>
              results: {resultsCount}
            </Text>
            <TouchableOpacity onPress={clearSearch} style={styles.clearBtn}>
              <Icon name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.filterSection}>
        <SortingComponent setSortKey={setSortKey} sortKey={sortKey} />
        <FilterComponent filters={filters} setFilters={setFilters} />
      </View>

      {showLoader && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={'#10B981'} />
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
  container: { flex: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 32,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  searchIcon: { marginRight: 8 },
  input: {
    flex: 1,
    paddingVertical: 4,
    lineHeight: 20,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  listContainer: { flexGrow: 1, paddingBottom: 32, paddingHorizontal: 14 },
  rowWrapper: { justifyContent: 'space-between', marginBottom: 8 },
  filterSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rightInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 4,
  },
  resultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  clearBtn: {
    padding: 2,
  },
});