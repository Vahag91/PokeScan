import React, { useState, useMemo, useRef, useEffect } from 'react';
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


export default function SetScreen() {
  const navigation = useNavigation();
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

  const renderFlatItem = ({ item }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.stickyHeader}>
          <Text style={styles.sectionTitle}>{item.title}</Text>
          <View style={styles.headerUnderline} />
        </View>
      );
    }

    return (
      <AnimatedRow
        itemPair={item.pair}
        index={item.index}
        onPress={setId => navigation.navigate('SetDetail', { setId })}
      />
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="sad-outline" size={48} color="#bbb" />
      <Text style={styles.emptyText}>No results found</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.pageTitle}>Search Card Sets</Text>

      <View style={styles.searchBox}>
        <Icon
          name="search-outline"
          size={18}
          color="#aaa"
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Search by set name..."
          placeholderTextColor="#999"
          style={styles.input}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Icon
              name="close-circle"
              size={20}
              color="#999"
              style={styles.clearIcon}
            />
          </TouchableOpacity>
        )}
      </View>

      {searchTerm.trim().length > 0 && flatData.length > 0 && (
        <Text style={styles.resultLabel}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  pageTitle: {
    fontSize: 24,
    color: '#111827',
    paddingHorizontal: 16,
    paddingBottom: 12,
    fontFamily: 'Lato-Bold',
  },
  searchBox: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
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
    color: '#111827',
    paddingVertical: 10,
    flex: 1,
    fontSize: 15,
  },
  resultLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 16,
    marginBottom: 8,
  },
  resultHighlight: {
    fontWeight: '600',
    color: '#111827',
  },
  stickyHeader: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  headerUnderline: {
    marginTop: 6,
    height: 1,
    width: '100%',
    backgroundColor: '#E5E7EB',
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
    fontSize: 16,
    color: '#999',
  },
});
