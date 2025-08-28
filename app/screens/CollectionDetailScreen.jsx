import React, { useState, useCallback, useMemo, useContext, memo } from 'react';
import { useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';
import {
  getDBConnection,
  getCardsByCollectionId,
  removeCardFromCollectionByRowId,
  removeAllCopiesOfCard,
  duplicateOneCardRow
} from '../lib/db';
import CardGridItem from '../components/collections/CardGridItem';
import AddCardItem from '../components/collections/AddCardItem';
import { ThemeContext } from '../context/ThemeContext';
import { globalStyles } from '../../globalStyles';

export const HeaderAddButton = memo(({ onPress }) => (
  <TouchableOpacity onPress={onPress} style={{ marginRight: 16 }}>
    <Ionicons name="add" size={26} color={'#10B981'} />
  </TouchableOpacity>
));

export default function CollectionDetailScreen() {
  const { theme } = useContext(ThemeContext);
  const route = useRoute();
  const navigation = useNavigation();
  const { collectionId, collection } = route.params;

  const [collectionInfo, setCollectionInfo] = useState(collection);
  const [cards, setCards] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [selectedSet, setSelectedSet] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [updateKey, setUpdateKey] = useState(0);


  const loadCollectionInfo = useCallback(async () => {
    const db = await getDBConnection();
    const results = await db.executeSql(
      `SELECT * FROM collections WHERE id = ? LIMIT 1`,
      [collectionId],
    );
    if (results[0]?.rows?.length) {
      setCollectionInfo(results[0].rows.item(0));
    }
  }, [collectionId]);

  const loadCards = useCallback(async () => {
    const db = await getDBConnection();
    const results = await getCardsByCollectionId(db, collectionId);
    setCards(results);
    await loadCollectionInfo();
    setUpdateKey(prev => prev + 1);
  }, [collectionId, loadCollectionInfo]);

  useFocusEffect(
    useCallback(() => {
      loadCards();
    }, [loadCards]),
  );



  const handleQuantityChange = async (item, newQty) => {
    if (newQty < 1) return;
  
    const db = await getDBConnection();
    const currentQty = item.quantity;
  
    if (newQty > currentQty) {
      // Add one more copy by duplicating an existing row
      await duplicateOneCardRow(db, item.cardId, item.collectionId);
    } else {
      // Remove one copy (deterministic)
      const results = await db.executeSql(
        `SELECT rowid FROM collection_cards
         WHERE cardId = ? AND collectionId = ?
         ORDER BY rowid DESC
         LIMIT 1`,
        [item.cardId, item.collectionId],
      );
      const row = results[0].rows.item(0);
      if (row?.rowid) {
        await removeCardFromCollectionByRowId(db, row.rowid, item.collectionId);
      }
    }
  
    await loadCards();
  };
  
  const handleDeleteAllCopies = async item => {
    const db = await getDBConnection();
    await removeAllCopiesOfCard(db, item.cardId, item.collectionId);
    await loadCards();
  };


  const uniqueSeries = useMemo(() => {
    const seriesMap = new Map();
    
    cards.forEach(card => {
      if (card.seriesName) {
        const language = card.language?.toLowerCase() || 'en';
        const flag = language === 'jp' ? '🇯🇵' : '🇺🇸';
        const key = `${card.seriesName}|${language}`;
        const displayName = `${card.seriesName} ${flag}`;
        
        if (!seriesMap.has(key)) {
          seriesMap.set(key, {
            name: card.seriesName,
            language: language,
            displayName: displayName,
            key: key
          });
        }
      }
    });
    
    return Array.from(seriesMap.values());
  }, [cards]);

  const uniqueSets = useMemo(() => {
    const setsMap = new Map();
    
    cards.forEach(card => {
      if (card.setName) {
        // Check if this set should be shown based on selected series
        if (selectedSeries) {
          const selectedLanguage = selectedSeries.language;
          const cardLanguage = card.language?.toLowerCase() || 'en';
          if (card.seriesName !== selectedSeries.name || cardLanguage !== selectedLanguage) {
            return; // Skip this card if it doesn't match the selected series
          }
        }
        
        const language = card.language?.toLowerCase() || 'en';
        const flag = language === 'jp' ? '🇯🇵' : '🇺🇸';
        const key = `${card.setName}|${language}`;
        const displayName = `${card.setName} ${flag}`;
        
        if (!setsMap.has(key)) {
          setsMap.set(key, {
            name: card.setName,
            language: language,
            displayName: displayName,
            key: key
          });
        }
      }
    });
    
    return Array.from(setsMap.values());
  }, [cards, selectedSeries]);

  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      if (selectedSet) {
        const cardLanguage = card.language?.toLowerCase() || 'en';
        return card.setName === selectedSet.name && cardLanguage === selectedSet.language;
      }
      if (selectedSeries) {
        const cardLanguage = card.language?.toLowerCase() || 'en';
        return card.seriesName === selectedSeries.name && cardLanguage === selectedSeries.language;
      }
      return true;
    });
  }, [cards, selectedSet, selectedSeries]);

  const groupedCards = useMemo(() => {
    const map = new Map();
    for (const card of filteredCards) {
      const key = card.cardId;
      if (!map.has(key)) {
        map.set(key, { ...card, quantity: 1 });
      } else {
        map.get(key).quantity += 1;
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name?.localeCompare(b.name),
    );
  }, [filteredCards]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderAddButton onPress={() => navigation.push('SearchStandalone')} />
      ),
    });
  }, [navigation]);
  const clearFilters = () => {
    setSelectedSet(null);
    setSelectedSeries(null);
  };


  const renderHeader = () => (
    <View key={collectionInfo?.updatedAt || updateKey}>
      <View style={styles.headerWrapper}>
        <Text style={[globalStyles.subheading, { color: theme.text }]}>
          {collectionInfo.name}
        </Text>
      </View>

      <View style={styles.summaryIcons}>
        <View style={styles.iconTextBox}>
          <LinearGradient
            colors={['#6366F1', '#818CF8']}
            style={styles.iconBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="layers-outline" size={16} color="#fff" />
          </LinearGradient>
          <Text style={[globalStyles.smallText, { color: theme.text }]}>
            {cards.length} {cards.length === 1 ? 'card' : 'cards'}
          </Text>
        </View>

        <View style={styles.iconTextBox}>
          <LinearGradient
            colors={['#10B981', '#34D399']}
            style={styles.iconBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="cash-outline" size={16} color="#fff" />
          </LinearGradient>
          <Text style={[globalStyles.smallText, { color: theme.text }]}>
            {collectionInfo.totalValue > 0
              ? `$${collectionInfo.totalValue.toFixed(2)}`
              : 'No value'}
          </Text>
        </View>
      </View>

      {uniqueSeries.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          {uniqueSeries.map(series => (
            <TouchableOpacity
              key={series.key}
              style={[
                styles.filterBadge,
                selectedSeries?.key === series.key && styles.activeFilter,
              ]}
              onPress={() => {
                setSelectedSeries(prev => {
                  const newSeries = prev?.key === series.key ? null : series;
                  setSelectedSet(null);
                  return newSeries;
                });
              }}
            >
              <Text
                style={[
                  globalStyles.smallText,
                  styles.filterText,
                  selectedSeries?.key === series.key && styles.activeFilterText,
                ]}
              >
                {series.displayName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {uniqueSets.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          {uniqueSets.map(set => (
            <TouchableOpacity
              key={set.key}
              style={[
                styles.filterBadge,
                selectedSet?.key === set.key && styles.activeFilter,
              ]}
              onPress={() =>
                setSelectedSet(prev => (prev?.key === set.key ? null : set))
              }
            >
              <Text
                style={[
                  globalStyles.smallText,
                  styles.filterText,
                  selectedSet?.key === set.key && styles.activeFilterText,
                ]}
              >
                {set.displayName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {(selectedSet || selectedSeries) && (
        <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
          <Ionicons name="close-outline" size={18} color="#fff" />
          <Text style={[globalStyles.smallText, styles.clearText]}>
            Clear filters
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderItem = ({ item }) => {
    if (item.type === 'add-button') {
      return (
        <AddCardItem
          onPress={() => navigation.navigate('MainTabs', { screen: 'Search' })}
        />
      );
    }

    const isSelected = selectedCardId === item.cardId;
    return (
      <CardGridItem
        item={item}
        isSelected={isSelected}
        onPress={() =>
          navigation.navigate('SingleCardScreen', { cardId: item.cardId, language: item.language?.toLowerCase() || 'en' })
        }
        onLongPress={() => setSelectedCardId(isSelected ? null : item.cardId)}
        onDecrease={() => handleQuantityChange(item, item.quantity - 1)}
        onIncrease={() => handleQuantityChange(item, item.quantity + 1)}
        onDelete={() => handleDeleteAllCopies(item)}
        onClose={() => setSelectedCardId(null)}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {groupedCards.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="albums-outline"
            size={64}
            color={theme.border}
            style={styles.emptyIcon}
          />
          <Text
            style={[
              globalStyles.subheading,
              styles.emptyTitle,
              { color: theme.text },
            ]}
          >
            No cards yet
          </Text>
          <Text
            style={[
              globalStyles.smallText,
              styles.emptySubtitle,
              { color: theme.mutedText },
            ]}
          >
            Start building your collection by adding cards.
          </Text>

          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.push('SearchStandalone')}
          >
            <Ionicons name="search" size={16} color="#fff" />
            <Text style={[globalStyles.smallText, styles.emptyButtonText]}>
              Find Cards
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
<FlatList
  data={[...groupedCards]}
  keyExtractor={item => item.cardId || 'add-button'}
  renderItem={renderItem}
  numColumns={2}
  ListHeaderComponent={renderHeader}
  columnWrapperStyle={styles.gridRow}
  contentContainerStyle={styles.list}
  extraData={updateKey + (collectionInfo?.updatedAt || '')}
  showsVerticalScrollIndicator={false}
/>

      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  list: { paddingBottom: 100 },
  gridRow: { justifyContent: 'space-between' },
  collectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  headerWrapper: {
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  summaryIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  iconTextBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  iconText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterScroll: {
    marginBottom: 8,
    paddingHorizontal: 6,
  },
  filterContainer: {
    paddingLeft: 2,
    paddingRight: 10,
  },
  filterBadge: {
    backgroundColor: '#E0F2FE',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0369A1',
  },
  activeFilter: { backgroundColor: '#0369A1' },
  activeFilterText: { color: '#fff' },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 24,
    marginBottom: 12,
    marginTop: 4,
  },
  clearText: {
    fontSize: 13,
    marginLeft: 6,
    color: '#fff',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  emptyButtonText: {
    marginLeft: 6,
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
