// screens/CollectionDetailScreen.jsx
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
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
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
import PremiumCollectionChart from '../components/PremiumCollectionChart';
import PaywallModal from './PaywallScreen';
import RNFS from 'react-native-fs';
import { normalizeCardFromDb } from '../utils';

const HISTORY_CAP = 450; // ~15 months
const historyPathFor = (id) => `${RNFS.DocumentDirectoryPath}/collection_history_${id}.json`;
const dateKeyUTC = (d = new Date()) => {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
async function upsertToday(collectionId, totalValue, cardCount) {
  const path = historyPathFor(collectionId);
  const today = dateKeyUTC();

  // read existing
  let points = [];
  try {
    const exists = await RNFS.exists(path);
    if (exists) {
      const txt = await RNFS.readFile(path, 'utf8');
      const parsed = JSON.parse(txt || '{}');
      if (Array.isArray(parsed.points)) points = parsed.points;
    }
  } catch {}

  // upsert today's point (value + count)
  const val = Number(totalValue) || 0;
  const cnt = Number(cardCount) || 0;
  const i = points.findIndex(p => p.date === today);
  const row = { date: today, totalValue: val, count: cnt };
  if (i >= 0) points[i] = row; else points.push(row);

  // sort ASC + cap
  points.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  if (points.length > HISTORY_CAP) points = points.slice(points.length - HISTORY_CAP);

  // atomic-ish write
  const tmp = `${path}.tmp`;
  await RNFS.writeFile(tmp, JSON.stringify({ points }), 'utf8');
  try { await RNFS.unlink(path); } catch {}
  await RNFS.moveFile(tmp, path);
}

export const AddMenu = memo(() => {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);
  const navigation = useNavigation();

  const handleAddFromScan = () => {
    navigation.navigate('MainTabs', { screen: 'Scan' });
  };

  const handleSearchCards = () => {
    navigation.push('SearchStandalone');
  };

  return (
    <Menu>
      <MenuTrigger>
        <View style={{ marginRight: 16 }}>
          <Ionicons name="add" size={26} color={'#10B981'} />
        </View>
      </MenuTrigger>
      <MenuOptions customStyles={getOptionsStyles(theme)}>
        <MenuOption onSelect={handleAddFromScan}>
          <View style={styles.optionRow}>
            <Ionicons name="scan" size={16} color="#10B981" />
            <Text style={[globalStyles.body, { color: theme.text }]}>
              {t('collections.detail.addFromScan', 'Add from Scan')}
            </Text>
          </View>
        </MenuOption>
        <MenuOption onSelect={handleSearchCards}>
          <View style={styles.optionRow}>
            <Ionicons name="search" size={16} color="#10B981" />
            <Text style={[globalStyles.body, { color: theme.text }]}>
              {t('collections.detail.searchCards', 'Search Cards')}
            </Text>
          </View>
        </MenuOption>
      </MenuOptions>
    </Menu>
  );
});

export default function CollectionDetailScreen() {
  const { t } = useTranslation();
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
  const [showPaywall, setShowPaywall] = useState(false);
  const [sortOption, setSortOption] = useState('price-desc');

  const loadCards = useCallback(async () => {
    const db = await getDBConnection();

    // cards (also for count)
    const results = await getCardsByCollectionId(db, collectionId);
    setCards(results);

    // collection info for totalValue
    const rows = await db.executeSql(
      `SELECT * FROM collections WHERE id = ? LIMIT 1`,
      [collectionId],
    );
    let row = null;
    if (rows[0]?.rows?.length) {
      row = rows[0].rows.item(0);
      setCollectionInfo(row);
    }

    // snapshot today (value + count)
    try {
      const total = row?.totalValue ?? 0;
      const count = results.length;
      await upsertToday(collectionId, total, count);
    } catch {}

    setUpdateKey(prev => prev + 1);
  }, [collectionId]);

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
      await duplicateOneCardRow(db, item.cardId, item.collectionId);
    } else {
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
          seriesMap.set(key, { name: card.seriesName, language, displayName, key });
        }
      }
    });
    return Array.from(seriesMap.values());
  }, [cards]);

  const uniqueSets = useMemo(() => {
    const setsMap = new Map();
    cards.forEach(card => {
      if (card.setName) {
        if (selectedSeries) {
          const selectedLanguage = selectedSeries.language;
          const cardLanguage = card.language?.toLowerCase() || 'en';
          if (card.seriesName !== selectedSeries.name || cardLanguage !== selectedLanguage) return;
        }
        const language = card.language?.toLowerCase() || 'en';
        const flag = language === 'jp' ? '🇯🇵' : '🇺🇸';
        const key = `${card.setName}|${language}`;
        const displayName = `${card.setName} ${flag}`;
        if (!setsMap.has(key)) {
          setsMap.set(key, { name: card.setName, language, displayName, key });
        }
      }
    });
    return Array.from(setsMap.values());
  }, [cards, selectedSeries]);

  const computeUnitPrice = useCallback((card) => {
    const normalized = normalizeCardFromDb(card);

    const extractTcgPrice = (tcg) => {
      const src = (tcg?.prices ?? tcg) || {};
      const markets = [];

      const walk = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        Object.values(obj).forEach((value) => {
          if (!value) return;
          if (typeof value === 'number') return;
          if (typeof value === 'object') {
            if (value?.market != null && typeof value.market === 'number') {
              markets.push(value.market);
            }
            walk(value);
          }
        });
      };

      walk(src);
      return markets.length ? markets[0] : null;
    };

    const extractCardmarketPrice = (cm) => {
      const src = (cm?.prices ?? cm) || {};
      const candidates = [
        src.averageSellPrice,
        src.trendPrice,
        src.lowPrice,
      ];
      return candidates.find((n) => typeof n === 'number' && !Number.isNaN(n)) ?? null;
    };

    const tcgPrice = extractTcgPrice(normalized.tcgplayer);
    if (tcgPrice != null) return tcgPrice;

    const cmPrice = extractCardmarketPrice(normalized.cardmarket);
    if (cmPrice != null) return cmPrice;

    return null;
  }, []);

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
      const unitPrice = computeUnitPrice(card);
      const existing = map.get(key);

      if (!existing) {
        map.set(key, {
          ...card,
          quantity: 1,
          unitPrice,
        });
        continue;
      }

      existing.quantity += 1;
      if (existing.unitPrice == null && unitPrice != null) {
        existing.unitPrice = unitPrice;
      }
    }

    return Array.from(map.values())
      .map(entry => ({
        ...entry,
        totalPrice:
          typeof entry.unitPrice === 'number'
            ? entry.unitPrice * entry.quantity
            : null,
      }))
      .sort((a, b) => {
        const nameA = (a.customName || a.name || '').toLowerCase();
        const nameB = (b.customName || b.name || '').toLowerCase();
        const pa =
          typeof a.unitPrice === 'number' && !Number.isNaN(a.unitPrice)
            ? a.unitPrice
            : null;
        const pb =
          typeof b.unitPrice === 'number' && !Number.isNaN(b.unitPrice)
            ? b.unitPrice
            : null;

        if (pa == null && pb == null) {
          if (nameA === nameB) return 0;
          return nameA > nameB ? 1 : -1;
        }

        if (pa == null) return 1;
        if (pb == null) return -1;

        const diff = sortOption === 'price-desc' ? pb - pa : pa - pb;
        if (diff !== 0) return diff;

        if (nameA === nameB) return 0;
        return nameA > nameB ? 1 : -1;
      });
  }, [filteredCards, computeUnitPrice, sortOption]);

  const sortConfig = useMemo(
    () => ({
      'price-desc': {
        label: t('collections.detail.sortPriceHighToLow'),
        icon: 'arrow-down',
      },
      'price-asc': {
        label: t('collections.detail.sortPriceLowToHigh'),
        icon: 'arrow-up',
      },
    }),
    [t],
  );

  const cycleSortOption = useCallback(() => {
    const order = ['price-desc', 'price-asc'];
    const currentIdx = order.indexOf(sortOption);
    const next = order[(currentIdx + 1) % order.length];
    setSortOption(next);
  }, [sortOption]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <AddMenu />
      ),
    });
  }, [navigation]);

  const clearFilters = () => {
    setSelectedSet(null);
    setSelectedSeries(null);
  };

  const handleAddFromScan = () => {
    navigation.navigate('MainTabs', { screen: 'Scan' });
  };

  const handleSearchCards = () => {
    navigation.push('SearchStandalone');
  };

  const renderHeader = () => (
    <View key={collectionInfo?.updatedAt || updateKey}>
      <View style={styles.headerWrapper}>
        <Text style={[globalStyles.subheading, { color: theme.text }]}>
          {collectionInfo?.name}
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
            {cards.length} {cards.length === 1 ? t('collections.detail.card') : t('collections.detail.cards')}
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
            {collectionInfo?.totalValue > 0
              ? `$${Number(collectionInfo.totalValue).toFixed(2)}`
              : t('collections.detail.noValue')}
          </Text>
        </View>
      </View>

      {/* Mini value chart (reads RNFS history) */}
      <PremiumCollectionChart
        collectionId={collectionId}
        onUpgradePress={() => setShowPaywall(true)}
      />

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
            {t('collections.detail.clearFilters')}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.sortWrapper}>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={cycleSortOption}
          activeOpacity={0.85}
        >
          <View style={styles.sortButtonInner}>
            <Ionicons
              name={sortConfig[sortOption]?.icon || 'swap-vertical'}
              size={16}
              color={theme.secondaryText}
            />
            <Text
              style={[
                globalStyles.smallText,
                styles.sortButtonText,
                { color: theme.text },
              ]}
            >
              {sortConfig[sortOption]?.label}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
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
          navigation.navigate('SingleCardScreen', {
            cardId: item.cardId,
            language: item.language?.toLowerCase() || 'en',
          })
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
            {t('collections.detail.noCardsYet')}
          </Text>
          <Text
            style={[
              globalStyles.smallText,
              styles.emptySubtitle,
              { color: theme.mutedText },
            ]}
          >
            {t('collections.detail.startBuilding')}
          </Text>

          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.push('SearchStandalone')}
          >
            <Ionicons name="search" size={16} color="#fff" />
            <Text style={[globalStyles.smallText, styles.emptyButtonText]}>
              {t('collections.detail.findCards')}
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

      {/* 💰 Paywall Modal */}
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </View>
  );
}

const getOptionsStyles = (theme) => ({
  optionsContainer: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: theme.cardCollectionBackground,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    minWidth: 120,
    maxWidth: 200,
    marginTop: 35,
  },
});

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
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  sortWrapper: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 2,
  },
  sortButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 18,
  },
  sortButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortButtonText: {
    fontSize: 15,
    fontWeight: '600',
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
    marginTop: 8,
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
  
  // Popup Menu Styles
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 10,
    flex: 1,
    minWidth: 100,
  },
});
