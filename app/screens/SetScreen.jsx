import React, { useState, useMemo, useRef, useEffect, useContext, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { categories as originalCategories } from '../constants';
import AnimatedRow from '../components/setSearch/AnimatedRow';
import { ThemeContext } from '../context/ThemeContext';
import { globalStyles } from '../../globalStyles';
import { getOwnedCardCountsBySet } from '../lib/db';

export default function SetScreen() {
  const [setStats, setSetStats] = useState({}); // setId => count

  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const [searchTerm, setSearchTerm] = useState('');
  const listRef = useRef(null);

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

  useEffect(() => {
    if (listRef.current && flatData.length > 0) {
      listRef.current.scrollToOffset({
        animated: true,
        offset: 0,
      });
    }
  }, [flatData]);

useFocusEffect(
  useCallback(() => {
    getOwnedCardCountsBySet().then(set => {
      setSetStats(set);
    });
  }, [])
);

  const renderFlatItem = ({ item }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.stickyHeader}>
          <Text
            style={[
              globalStyles.subheading,
              styles.sectionTitle,
              { color: theme.text },
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
  setStats={setStats}
/>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="sad-outline" size={48} color={theme.placeholder} />
      <Text
        style={[
          globalStyles.body,
          styles.emptyText,
          { color: theme.placeholder },
        ]}
      >
        No results found
      </Text>
    </View>
  );

  const styles = useMemo(
    () =>
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
      }),
    [theme],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Text
          style={[
            globalStyles.heading,
            styles.pageTitle,
            { color: theme.text },
          ]}
        >
          Search Card Sets
        </Text>
      </View>

      <View style={styles.searchBox}>
        <Icon
          name="search-outline"
          size={18}
          color={theme.placeholder}
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Search by set name..."
          placeholderTextColor={theme.placeholder}
          style={styles.input}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Icon
              name="close-circle"
              size={20}
              color={theme.placeholder}
              style={styles.clearIcon}
            />
          </TouchableOpacity>
        )}
      </View>

      {searchTerm.trim().length > 0 && flatData.length > 0 && (
        <Text
          style={[
            globalStyles.smallText,
            styles.resultLabel,
            { color: theme.mutedText },
          ]}
        >
          Showing results for:{' '}
          <Text style={styles.resultHighlight}>"{searchTerm.trim()}"</Text>
        </Text>
      )}

      {flatData.length === 0 ? (
        renderEmpty()
      ) : (
        <FlatList
          ref={listRef}
          data={flatData}
          keyExtractor={(_, index) => `item-${index}`}
          renderItem={renderFlatItem}
          contentContainerStyle={styles.gridContent}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}
