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
  Dimensions,
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
import { searchCardsUnified } from '../../supabase/utils';
import { ThemeContext } from '../context/ThemeContext';
import { globalStyles } from '../../globalStyles';
import { mergeCardWithPrice } from '../../supabase/utils';
import { SubscriptionContext } from '../context/SubscriptionContext';

export default function SearchScreen() {
  const { width: screenWidth } = Dimensions.get('window');
  const { theme } = useContext(ThemeContext);
  const [term, setTerm] = useState('');
  const [hydratedDefaults, setHydratedDefaults] = useState(defaultSearchCards);
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
  const [language, setLanguage] = useState('en'); 

  const loaderTimeoutRef = useRef(null);
  const flatListRef = useRef(null);
  const requestIdRef = useRef(0); // ensures only latest request updates state

  const {
    purchasePackage,
    restorePurchases,
    fetchOfferings,
    availablePackages,
  } = useContext(SubscriptionContext);

  // Explicit snapshot-based fetch (avoid closure over stale language)
  const fetchResults = useCallback(
    async (q, lang) => {
      const query = (q ?? term).trim();
      const selectedLang = lang ?? language;
      if (!query) return;

      const myRequestId = ++requestIdRef.current;

      setErrorType(null);
      setErrorMessage(null);
      setHasFetched(false);
      setResults([]);

      clearTimeout(loaderTimeoutRef.current);
      setShowLoader(false);
      loaderTimeoutRef.current = setTimeout(() => {
        if (myRequestId === requestIdRef.current) setShowLoader(true);
      }, 200);

      try {
        const data = await searchCardsUnified(query, { language: selectedLang });
        if (myRequestId !== requestIdRef.current) return; // stale response
        setHasFetched(true);

        if (!data || data.length === 0) {
          setErrorType('noResults');
          setErrorMessage(`No results for “${query}”.`);
          setResults([]);
        } else {
          setResults(data);
        }
      } catch (e) {
        if (myRequestId !== requestIdRef.current) return; // stale response
        setHasFetched(true);
        setErrorType('network');
        setErrorMessage('Unable to connect. Please try again.');
      } finally {
        if (myRequestId !== requestIdRef.current) return; // stale response
        clearTimeout(loaderTimeoutRef.current);
        setShowLoader(false);
      }
    },
    [term, language]
  );

  // Debounce search on both term and language (single source of truth)
  useEffect(() => {
    if (!term.trim()) return;
    const id = setTimeout(() => {
      fetchResults(term, language); // pass explicit snapshots
    }, 400);
    return () => clearTimeout(id);
  }, [term, language, fetchResults]);

  useEffect(() => {
    setHasFetched(false);
  }, [term]);

  useEffect(() => {
    if (flatListRef.current && filteredAndSortedResults.length > 0) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [filters, sortKey]);

  useEffect(() => {
    (async () => {
      const updated = await Promise.all(
        defaultSearchCards.map(card => mergeCardWithPrice(card))
      );
      setHydratedDefaults(updated);
    })();
  }, []);

  const clearSearch = () => {
    Keyboard.dismiss();
    setTerm('');
    setResults([]);
    setErrorType(null);
    setErrorMessage(null);
    setHasFetched(false);
    requestIdRef.current++; // cancel any in-flight requests
    clearTimeout(loaderTimeoutRef.current);
    setShowLoader(false);
  };

  const retryFetch = () => fetchResults(term, language);

  const dataToSort = term.trim() ? results : language === 'en' ? hydratedDefaults : [];

  function LanguageToggle({ value, onChange }) {
    // Responsive font size based on screen width
    const getFontSize = () => {
      if (screenWidth >= 450) return 16;
      if (screenWidth >= 400) return 15;
      if (screenWidth >= 350) return 14;
      return 13;
    };

    return (
      <View style={styles.languageToggleWrapper}>
        {['en', 'jp'].map(opt => (
          <TouchableOpacity
            key={opt}
            onPress={() => onChange(opt)}
            style={[
              styles.languageToggleBtn,
              {
                backgroundColor: value === opt ? '#10B981' : theme.cardBackground,
                borderColor: value === opt ? '#10B981' : theme.border,
                shadowColor: value === opt ? '#10B981' : theme.shadowColor,
              }
            ]}
            activeOpacity={0.8}
          >
            <Text 
              numberOfLines={1}
              style={[
                styles.languageToggleText,
                {
                  color: value === opt ? '#FFFFFF' : theme.text,
                  fontWeight: value === opt ? '700' : '600',
                  fontSize: getFontSize(),
                }
              ]}>
              {opt === 'en' ? '🇺🇸 English Card' : '🇯🇵 Japanese Card'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

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
            (item.set?.releaseDate || '2000/01/01').replace(/\//g, '-')
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
        (card.types || []).some(t => filters.type.includes(t));

      const matchesAttack =
        filters.attack.length === 0 ||
        (card.attacks || []).some(attack =>
          (attack.cost || []).some(costType => filters.attack.includes(costType))
        );

      const hpRange = Array.isArray(filters.hp) ? filters.hp : null;
      const hpVal = parseInt(card.hp, 10);
      const matchesHp = !hpRange
        ? true
        : Number.isFinite(hpVal) && hpVal >= hpRange[0] && hpVal <= hpRange[1];

      const regulationMark = card.regulationMark ?? card.regulationmark;
      const matchesRegulation =
        filters.regulation.length === 0 ||
        (regulationMark && filters.regulation.includes(regulationMark));

      const matchesLegality =
        filters.legality.length === 0 ||
        (card.legalities &&
          filters.legality.some(
            format => card.legalities[format.toLowerCase()] === 'Legal'
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
      {/* Language Toggle - Above Search Bar */}
      <View style={styles.languageToggleContainer}>
        <LanguageToggle value={language} onChange={setLanguage} />
      </View>
      
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
        <Icon
          name="search"
          size={24}
          color={theme.mutedText}
          style={styles.searchIcon}
        />
        <TextInput
          style={[globalStyles.body, styles.input, { color: theme.text }]}
          placeholder="Search"
          placeholderTextColor={theme.placeholder}
          value={term}
          onChangeText={setTerm}
          returnKeyType="search"
          onSubmitEditing={() => {
            Keyboard.dismiss();
            if (term.trim()) fetchResults(term, language); // explicit snapshots
          }}
        />
        {!!term && hasFetched && !showLoader && (
          <View style={styles.rightInfoContainer}>
            <Text
              style={[
                globalStyles.smallText,
                styles.resultBadge,
                { color: theme.secondaryText },
              ]}
            >
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
        <View className="loader" style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={'#10B981'} />
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={filteredAndSortedResults}
        extraData={language} // force refresh across language flips
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <RenderSearchSingleCard item={item} showCardNumber selectedLanguage={language} />
        )}
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
  languageToggleContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  languageToggleWrapper: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  languageToggleBtn: {
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    minHeight: 42,
    flex: 1,
    marginHorizontal: 2,
  },
  languageToggleText: {
    letterSpacing: 0.1,
    textAlign: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    numberOfLines: 1,
    fontFamily: "Lato-Bold",
  },
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
  input: { flex: 1, paddingVertical: 4, lineHeight: 20 },
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
  resultBadge: { paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
  clearBtn: { padding: 2 },
});
