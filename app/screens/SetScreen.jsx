import React, {
  useState,
  useMemo,
  useRef,
  useContext,
  useCallback,
} from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { fetchEnglishSets, fetchJapaneseSets } from '../../supabase/utils';
import AnimatedRow from '../components/setSearch/AnimatedRow';
import { ThemeContext } from '../context/ThemeContext';
import { globalStyles } from '../../globalStyles';
import { getOwnedCardCountsBySet } from '../lib/db';
import ErrorView from '../components/ErrorView';
import useSafeAsync from '../hooks/useSafeAsync';
import LanguageToggle from '../components/LanguageToggle';

export default function SetScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const listRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [language, setLanguage] = useState('en');
  const [isLanguageSwitching, setIsLanguageSwitching] = useState(false);

  const fetchSetStats = useMemo(
    () => () => getOwnedCardCountsBySet(),
    []
  );

  const { data: setStats, loading, error, retry } = useSafeAsync(fetchSetStats);
  // Refresh set stats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      retry();
    }, [retry])
  );

  // Fetch English sets
  const fetchEnglishSetsData = useMemo(
    () => () => fetchEnglishSets(),
    []
  );

  const { data: englishSets = [], loading: englishLoading } = useSafeAsync(fetchEnglishSetsData);

  // Fetch Japanese sets
  const fetchJapaneseSetsData = useMemo(
    () => () => fetchJapaneseSets(),
    []
  );

  const { data: japaneseSets = [], loading: japaneseLoading } = useSafeAsync(fetchJapaneseSetsData);

  // Cache sets to prevent refetching
  const cachedEnglishSets = useMemo(() => englishSets, [englishSets]);
  const cachedJapaneseSets = useMemo(() => japaneseSets, [japaneseSets]);

  // Handle language change with clearing
  const handleLanguageChange = (newLanguage) => {
    if (newLanguage !== language) {
      setIsLanguageSwitching(true);
      setLanguage(newLanguage);
      // Clear search term when switching languages
      setSearchTerm('');
      // Reset switching state after a short delay
      setTimeout(() => setIsLanguageSwitching(false), 100);
    }
  };

  const languageOptions = [
    { key: 'en', label: t('languageToggle.englishCards') },
    { key: 'jp', label: t('languageToggle.japaneseCards') }
  ];

  // Helper function to group sets by series
  const groupSetsBySeries = (sets) => {
    const grouped = {};

    sets.forEach(set => {
      const seriesName = set.series_name || 'Other';
      if (!grouped[seriesName]) {
        grouped[seriesName] = [];
      }
      grouped[seriesName].push(set);
    });

    return grouped;
  };

  const flatData = useMemo(() => {
    // Don't show data while switching languages
    if (isLanguageSwitching) {
      return [];
    }

    const term = searchTerm.trim().toLowerCase();
    const result = [];

    if (language === 'en') {
      // Show English sets from database grouped by series
      if (cachedEnglishSets && cachedEnglishSets.length > 0) {
        const filteredEnglishSets = cachedEnglishSets.filter(set =>
          set.name && set.name.toLowerCase().includes(term),
        );

        if (filteredEnglishSets.length > 0) {
          const groupedSets = groupSetsBySeries(filteredEnglishSets);

          Object.entries(groupedSets).forEach(([seriesName, sets]) => {
            if (sets.length > 0) {
              result.push({ type: 'header', title: seriesName });

              for (let i = 0; i < sets.length; i += 2) {
                const set1 = sets[i];
                const set2 = sets[i + 1];

                result.push({
                  type: 'item',
                  pair: [
                    {
                      id: set1.id,
                      title: set1.name,
                      image: { uri: set1.logo_url },
                      logoUrl: set1.logo_url,
                      releaseDate: set1.release_date,
                      total: set1.total ?? set1.total_cards ?? null,
                    },
                    set2 ? {
                      id: set2.id,
                      title: set2.name,
                      image: { uri: set2.logo_url },
                      logoUrl: set2.logo_url,
                      releaseDate: set2.release_date,
                      total: set2.total ?? set2.total_cards ?? null,
                    } : null
                  ],
                  index: i / 2,
                  isEnglish: true,
                });
              }
            }
          });
        }
      }
    } else {
      // Show Japanese sets from database grouped by series
      if (cachedJapaneseSets && cachedJapaneseSets.length > 0) {
        const filteredJapaneseSets = cachedJapaneseSets.filter(set =>
          set.name && set.name.toLowerCase().includes(term),
        );

        if (filteredJapaneseSets.length > 0) {
          const groupedSets = groupSetsBySeries(filteredJapaneseSets);

          Object.entries(groupedSets).forEach(([seriesName, sets]) => {
            if (sets.length > 0) {
              result.push({ type: 'header', title: seriesName });

              for (let i = 0; i < sets.length; i += 2) {
                const set1 = sets[i];
                const set2 = sets[i + 1];

                result.push({
                  type: 'item',
                  pair: [
                    {
                      id: set1.id,
                      title: set1.name,
                      image: { uri: set1.logo_url },
                      logoUrl: set1.logo_url,
                      releaseDate: set1.release_date,
                      total: set1.total ?? set1.total_cards ?? null,
                    },
                    set2 ? {
                      id: set2.id,
                      title: set2.name,
                      image: { uri: set2.logo_url },
                      logoUrl: set2.logo_url,
                      releaseDate: set2.release_date,
                      total: set2.total ?? set2.total_cards ?? null,
                    } : null
                  ],
                  index: i / 2,
                  isEnglish: false,
                });
              }
            }
          });
        }
      }
    }

    return result;
  }, [searchTerm, language, cachedEnglishSets, cachedJapaneseSets, isLanguageSwitching]);

  useMemo(() => {
    if (listRef.current && flatData.length > 0) {
      listRef.current.scrollToOffset({
        animated: true,
        offset: 0,
      });
    }
  }, [flatData]);

  const renderFlatItem = ({ item }) => {
    if (item.type === 'header') {
      return (
        <View style={styles(theme).stickyHeader}>
          <Text
            style={[
              globalStyles.subheading,
              styles(theme).sectionTitle,
              styles(theme).text,
            ]}
          >
            {item.title}
          </Text>
        </View>
      );
    }

    return (
      <AnimatedRow
        itemPair={item.pair}
        index={item.index}
        onPress={(setItem) =>
          navigation.navigate('SetDetail', {
            setId: setItem?.id,
            language,
            setMeta: setItem
              ? {
                  id: setItem.id,
                  name: setItem.title,
                  logoUrl: setItem.logoUrl || setItem.image?.uri,
                  releaseDate: setItem.releaseDate,
                  total: setItem.total,
                }
              : null,
          })
        }
        setStats={setStats || {}}
      />
    );
  };

  const renderEmpty = () => (
    <View style={styles(theme).emptyContainer}>
      <Icon name="sad-outline" size={48} color={theme.placeholder} />
      <Text
        style={[
          globalStyles.body,
          styles(theme).emptyText,
          { color: theme.placeholder },
        ]}
      >
        {t('search.noResults')}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles(theme).container} edges={['top']}>
      <View style={styles(theme).topBar}>
        <Text
          style={[
            globalStyles.heading,
            styles(theme).pageTitle,
          ]}
        >
          {t('sets.searchCardSets')}
        </Text>
      </View>

      {/* Language Toggle - Above Search Bar */}
      <View style={styles(theme).languageToggleContainer}>
        <LanguageToggle 
          value={language} 
          onChange={handleLanguageChange} 
          options={languageOptions}
          chipPaddingHorizontal={16}
        />
      </View>

      <View style={styles(theme).searchBox}>
        <Icon
          name="search-outline"
          size={18}
          color={theme.placeholder}
          style={styles(theme).searchIcon}
        />
        <TextInput
          placeholder={t('search.searchBySetName')}
          placeholderTextColor={theme.placeholder}
          style={styles(theme).input}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Icon
              name="close-circle"
              size={20}
              color={theme.placeholder}
              style={styles(theme).clearIcon}
            />
          </TouchableOpacity>
        )}
      </View>

      {(loading || englishLoading || japaneseLoading || isLanguageSwitching) ? (
        <ActivityIndicator style={styles(theme).loader} size="large" color={'#10B981'} />
      ) : error ? (
        <ErrorView message={t('sets.failedToLoadStats')} onRetry={retry} />
      ) : flatData.length === 0 ? (
        renderEmpty()
      ) : (
        <>
          {searchTerm.trim().length > 0 && flatData.length > 0 && (
            <Text style={[globalStyles.smallText, styles(theme).resultLabel]}>
              {t('search.showingResultsFor')}{' '}
              <Text style={styles(theme).resultHighlight}>
                "{searchTerm.trim()}"
              </Text>
            </Text>
          )}
          <FlatList
            ref={listRef}
            data={flatData}
            keyExtractor={(item, idx) => {
              if (item.type === 'header') return `hdr-${item.title}`;
              const [a, b] = item.pair || [];
              return `row-${a?.id || 'null'}-${b?.id || 'null'}-${item.index ?? idx}`;
            }}
            renderItem={renderFlatItem}
            contentContainerStyle={styles(theme).gridContent}
            keyboardShouldPersistTaps="handled"
            style={styles(theme).flatListWrapper}
            extraData={setStats}  // re-render rows when owned counts change
          />

        </>
      )}
    </SafeAreaView>
  );
}

const styles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 12,
    },
    pageTitle: {
      color: theme.text,
    },
    languageToggleContainer: {
      paddingTop: 8,
      paddingBottom: 16,
    },

    searchBox: {
      flexDirection: 'row',
      backgroundColor: theme.inputBackground,
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 12,
      paddingHorizontal: 12,
      alignItems: 'center',
    },
    searchIcon: {
      marginRight: 6,
    },
    clearIcon: {
      marginLeft: 8,
    },
    input: {
      color: theme.inputText,
      paddingVertical: 10,
      flex: 1,
      fontSize: 15,
      fontFamily: 'Lato-Regular',
    },
    resultLabel: {
      marginLeft: 16,
      marginBottom: 8,
      color: theme.mutedText,
    },
    resultHighlight: {
      fontFamily: 'Lato-Bold',
      color: theme.text,
    },
    stickyHeader: {
      backgroundColor: theme.background,
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 8,
    },
    sectionTitle: {
      fontSize: 17,
    },
    gridContent: {
      paddingBottom: 60,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 100,
    },
    emptyText: {
      marginTop: 8,
    },
    loader: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    flatListWrapper: {
      flex: 1,
    },
    text: {
      color: theme.text,
    },
  });
