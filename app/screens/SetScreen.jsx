import React, {
  useState,
  useMemo,
  useRef,
  useContext,
} from 'react';
import { useNavigation } from '@react-navigation/native';
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
import { categories as originalCategories } from '../constants';
import AnimatedRow from '../components/setSearch/AnimatedRow';
import { ThemeContext } from '../context/ThemeContext';
import { globalStyles } from '../../globalStyles';
import { getOwnedCardCountsBySet } from '../lib/db';
import ErrorView from '../components/ErrorView';
import useSafeAsync from '../hooks/useSafeAsync';

export default function SetScreen() {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const listRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState('');

  const fetchSetStats = useMemo(
    () => () => getOwnedCardCountsBySet(),
    []
  );

  const { data: setStats, loading, error, retry } = useSafeAsync(fetchSetStats);

  const flatData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const result = [];

    originalCategories.forEach(section => {
      const filteredData = section.data.filter(item =>
        item.title.toLowerCase().includes(term),
      );

      if (filteredData.length > 0) {
        result.push({ type: 'header', title: section.title });

        for (let i = 0; i < filteredData.length; i += 2) {
          result.push({
            type: 'item',
            pair: [filteredData[i], filteredData[i + 1] || null],
            index: i / 2,
          });
        }
      }
    });

    return result;
  }, [searchTerm]);

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
        onPress={setId => navigation.navigate('SetDetail', { setId })}
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
        No results found
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
          Search Card Sets
        </Text>
      </View>

      <View style={styles(theme).searchBox}>
        <Icon
          name="search-outline"
          size={18}
          color={theme.placeholder}
          style={styles(theme).searchIcon}
        />
        <TextInput
          placeholder="Search by set name..."
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

      {loading ? (
        <ActivityIndicator style={styles(theme).loader} size="large" color={theme.text} />
      ) : error ? (
        <ErrorView message="Failed to load your set stats." onRetry={retry} />
      ) : flatData.length === 0 ? (
        renderEmpty()
      ) : (
        <>
          {searchTerm.trim().length > 0 && flatData.length > 0 && (
            <Text style={[globalStyles.smallText, styles(theme).resultLabel]}>
              Showing results for:{' '}
              <Text style={styles(theme).resultHighlight}>
                "{searchTerm.trim()}"
              </Text>
            </Text>
          )}
          <FlatList
            ref={listRef}
            data={flatData}
            keyExtractor={(_, index) => `item-${index}`}
            renderItem={renderFlatItem}
            contentContainerStyle={styles(theme).gridContent}
            keyboardShouldPersistTaps="handled"
            style={styles(theme).flatListWrapper}
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