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
import { useTranslation } from 'react-i18next';
import {
  RenderSearchSingleCard,
  EmptyState,
  SortingComponent,
  FilterComponent,
} from '../components/searchScreen';
import { getCardPrice } from '../utils';
import { defaultSearchCards, defaultSearchCardsJP } from '../constants';
import { searchCardsUnified } from '../../supabase/utils';
import { ThemeContext } from '../context/ThemeContext';
import { globalStyles } from '../../globalStyles';
import { mergeCardWithPrice } from '../../supabase/utils';
import LanguageToggle from '../components/LanguageToggle';

export default function SearchScreen() {
  const { t } = useTranslation();
  Dimensions.get('window');
  const { theme } = useContext(ThemeContext);
  const [term, setTerm] = useState('');
  const [hydratedDefaults, setHydratedDefaults] = useState(defaultSearchCards);
  const [hydratedDefaultsJP, setHydratedDefaultsJP] = useState(defaultSearchCardsJP);
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
  const hasSearchedRef = useRef(false);

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
        hasSearchedRef.current = true;

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
        hasSearchedRef.current = true;
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

  // Search only when user presses Enter or dismisses keyboard
  // No automatic debounce while typing
  const debounceTimeoutRef = useRef(null);
  const isInputFocused = useRef(false);

  // Reset search state when term changes
  useEffect(() => {
    if (term.trim()) {
      setHasFetched(false);
      setResults([]);
      setErrorType(null);
      setErrorMessage(null);
    }
  }, [term]);

  useEffect(() => {
    if (flatListRef.current && resultsCount > 0) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [filters, sortKey, resultsCount]);

  useEffect(() => {
    if (flatListRef.current && resultsCount > 0) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [language, resultsCount]);

  useEffect(() => {
    (async () => {
      const updated = await Promise.all(
        defaultSearchCards.map(card => mergeCardWithPrice(card))
      );
      setHydratedDefaults(updated);
      
      const updatedJP = await Promise.all(
        defaultSearchCardsJP.map(card => mergeCardWithPrice(card))
      );
      setHydratedDefaultsJP(updatedJP);
    })();
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const clearSearch = () => {
    Keyboard.dismiss();
    setTerm('');
    setResults([]);
    setErrorType(null);
    setErrorMessage(null);
    setHasFetched(false);
    hasSearchedRef.current = false;
    requestIdRef.current++; // cancel any in-flight requests
    clearTimeout(loaderTimeoutRef.current);
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    setShowLoader(false);
  };

  const retryFetch = () => fetchResults(term, language);

  const handleLanguageChange = useCallback(
    (newLanguage) => {
      if (!newLanguage || newLanguage === language) return;
      setLanguage(newLanguage);

      // If the user already searched, re-run the search in the new language.
      const query = term.trim();
      if (query && hasSearchedRef.current) {
        fetchResults(query, newLanguage);
        return;
      }

      // If no active search yet, just reset any stale search UI.
      setResults([]);
      setErrorType(null);
      setErrorMessage(null);
      setHasFetched(false);
    },
    [fetchResults, language, term],
  );

  const dataToSort = useMemo(() => {
    if (term.trim()) return Array.isArray(results) ? results : [];
    if (language === 'en') return Array.isArray(hydratedDefaults) ? hydratedDefaults : [];
    if (language === 'jp') return Array.isArray(hydratedDefaultsJP) ? hydratedDefaultsJP : [];
    return [];
  }, [term, results, language, hydratedDefaults, hydratedDefaultsJP]);

  const languageOptions = [
    { key: 'en', label: t('languageToggle.englishCards') },
    { key: 'jp', label: t('languageToggle.japaneseCards') }
  ];

  const sortedResults = useMemo(() => {
    const list = Array.isArray(dataToSort) ? dataToSort : [];
    if (list.length === 0 || !sortKey) return list;
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

    return [...list].sort((a, b) => {
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
    const list = Array.isArray(sortedResults) ? sortedResults : [];
    return list.filter(card => {
      const matchesRarity =
        filters.rarity.length === 0 || filters.rarity.includes(card.rarity);

      const matchesType =
        filters.type.length === 0 ||
        (card.types || []).some(type => filters.type.includes(type));

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

  const resultsCount = filteredAndSortedResults?.length ?? 0;

  const handleInputBlur = () => {
    // Search when input loses focus if there's a term
    if (term.trim()) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        fetchResults(term, language);
      }, 100); // Small delay to ensure keyboard is fully dismissed
    }
    isInputFocused.current = false;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Language Toggle - Above Search Bar */}
      <View style={styles.languageToggleContainer}>
        <LanguageToggle 
          value={language} 
          onChange={handleLanguageChange} 
          options={languageOptions}
          chipPaddingHorizontal={12}
        />
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
          placeholder={t('search.searchPlaceholder')}
          placeholderTextColor={theme.placeholder}
          value={term}
          onChangeText={setTerm}
          returnKeyType="search"
          onFocus={() => {
            isInputFocused.current = true;
          }}
          onBlur={handleInputBlur}
          onSubmitEditing={() => {
            Keyboard.dismiss();
            // Clear debounce timeout and search immediately
            if (debounceTimeoutRef.current) {
              clearTimeout(debounceTimeoutRef.current);
            }
            if (term.trim()) fetchResults(term, language);
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
              {`${resultsCount || 0} ${t('search.resultsText', 'results')}`}
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
          <RenderSearchSingleCard item={item} showCardNumber selectedLanguage={item.language ?? language} />
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
        keyboardShouldPersistTaps="never"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  languageToggleContainer: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
    alignItems: 'center',
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
