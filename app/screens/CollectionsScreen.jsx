// screens/CollectionsScreen.jsx
import React, { useEffect, useState, useCallback, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import CreateCollectionModal from '../components/collections/CreateCollectionModal';
import EditCollectionModal from '../components/collections/EditCollectionModal';
import AddCollectionCard from '../components/collections/AddCollectionCard';
import {
  getDBConnection,
  getAllCollectionsWithPreviewCards,
  renameCollection,
  deleteCollection,
  updateCollectionTotalValue
} from '../lib/db';
import { useFocusEffect } from '@react-navigation/native';
import CollectionCard from '../components/collections/CollectionCard';
import { CollectionHeader } from '../components/collections/CollectionHeader';
import { ThemeContext } from '../context/ThemeContext';
import { SubscriptionContext } from '../context/SubscriptionContext';
import { globalStyles } from '../../globalStyles';
import LockedBlurOverlay from '../components/searchScreen/filter/LockedBlurOverlay';
import PaywallModal from '../screens/PaywallScreen';
import { updateCollectionCardPrices } from '../../supabase/utils';

// ✅ RNFS helpers inline
import RNFS from 'react-native-fs';

const HISTORY_CAP = 450;
const historyPathFor = (id) => `${RNFS.DocumentDirectoryPath}/collection_history_${id}.json`;
const dateKeyUTC = (d = new Date()) => {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

async function upsertTodayInline(collectionId, totalValue, cardCount) {
  const path = historyPathFor(collectionId);
  const today = dateKeyUTC();

  // read existing
  let points = [];
  try {
    if (await RNFS.exists(path)) {
      const txt = await RNFS.readFile(path, 'utf8');
      const parsed = JSON.parse(txt || '{}');
      if (Array.isArray(parsed.points)) points = parsed.points;
    }
  } catch {}

  // upsert today's (value + count)
  const val = Number(totalValue) || 0;
  const cnt = Number(cardCount) || 0;
  const i = points.findIndex(p => p.date === today);
  const row = { date: today, totalValue: val, count: cnt };
  if (i >= 0) points[i] = row; else points.push(row);

  // sort + cap
  points.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  if (points.length > HISTORY_CAP) points = points.slice(points.length - HISTORY_CAP);

  // atomic-ish write
  const tmp = `${path}.tmp`;
  await RNFS.writeFile(tmp, JSON.stringify({ points }), 'utf8');
  try { await RNFS.unlink(path); } catch {}
  await RNFS.moveFile(tmp, path);
}

async function deleteHistoryInline(collectionId) {
  const path = historyPathFor(collectionId);
  try { if (await RNFS.exists(path)) await RNFS.unlink(path); } catch {}
}

// count cards (all copies) for a collection
async function getCollectionCardCount(db, collectionId) {
  try {
    const res = await db.executeSql(
      `SELECT COUNT(*) as cnt FROM collection_cards WHERE collectionId = ?`,
      [collectionId]
    );
    const cnt = res?.[0]?.rows?.item(0)?.cnt ?? 0;
    return Number(cnt) || 0;
  } catch {
    return 0;
  }
}

export default function CollectionsScreen({ navigation }) {
  const { theme } = useContext(ThemeContext);
  const { isPremium } = useContext(SubscriptionContext);
  const { t } = useTranslation();

  const [collections, setCollections] = useState([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [showLockedOverlay, setShowLockedOverlay] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.95))[0];

  const loadCollections = useCallback(async () => {
    const db = await getDBConnection();
    const all = await getAllCollectionsWithPreviewCards(db);
    setCollections(all);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCollections();
    }, [loadCollections]),
  );

  // 🔁 Daily sync: refresh prices -> recompute totals -> snapshot (value+count) -> refresh
  useFocusEffect(
    useCallback(() => {
      const syncPricesAndLoad = async () => {
        await updateCollectionCardPrices();

        const db = await getDBConnection();

        // read
        let all = await getAllCollectionsWithPreviewCards(db);

        // recompute totals
        for (const c of all) {
          await updateCollectionTotalValue(db, c.id);
        }

        // re-read after totals
        all = await getAllCollectionsWithPreviewCards(db);

        // snapshot (value + count)
        for (const c of all) {
          const cnt = await getCollectionCardCount(db, c.id);
          await upsertTodayInline(c.id, c.totalValue ?? 0, cnt);
        }

        await loadCollections();
      };
      syncPricesAndLoad();
    }, [loadCollections])
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  const openEditModal = collection => {
    setEditingCollection(collection);
    setEditModalVisible(true);
  };

  const handleEditSave = async newName => {
    if (!newName.trim()) return;
    const db = await getDBConnection();
    await renameCollection(db, editingCollection.id, newName.trim());
    setEditModalVisible(false);
    setEditingCollection(null);
    loadCollections();
  };

  // 🗑️ Also remove sidecar history when deleting a collection
  const handleDelete = async collection => {
    const db = await getDBConnection();
    await deleteCollection(db, collection.id);
    await deleteHistoryInline(collection.id);
    setEditModalVisible(false);
    setEditingCollection(null);
    loadCollections();
  };

  const handleAddCollection = () => {
    if (!isPremium && collections.length >= 2) {
      setShowLockedOverlay(true);
      return;
    }
    setCreateModalVisible(true);
  };

  const renderItem = ({ item }) => {
    if (item.isAddCard) {
      return (
        <View style={styles.renderItem}>
          <AddCollectionCard onPress={handleAddCollection} />
        </View>
      );
    }

    return (
      <View style={styles.renderItem}>
        <CollectionCard
          item={item}
          onPress={() =>
            navigation.navigate('CollectionDetail', {
              collectionId: item.id,
              collection: item,
            })
          }
          onEditPress={openEditModal}
          onDelete={handleDelete}
        />
      </View>
    );
  };

  const dataWithAdd = [...collections, { id: 'add-card', isAddCard: true }];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <CollectionHeader collections={collections} />
      <FlatList
        data={dataWithAdd}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        numColumns={1}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="folder-open-outline"
              size={64}
              color={theme.mutedText}
            />
            <Text
              style={[
                globalStyles.text,
                styles.emptyText,
                { color: theme.text },
              ]}
            >
              {t('collections.emptyState.title')}
            </Text>
            <Text
              style={[
                globalStyles.text,
                styles.emptySubtext,
                { color: theme.mutedText },
              ]}
            >
              {t('collections.emptyState.subtitle')}
            </Text>
          </View>
        }
      />

      <CreateCollectionModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCreated={loadCollections}
      />

      <EditCollectionModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        initialName={editingCollection?.name}
        onSave={handleEditSave}
        onDelete={handleDelete}
      />

      {showLockedOverlay && (
        <LockedBlurOverlay
          title={t('lockedOverlay.collectionLimitReached')}
          subtitle={t('lockedOverlay.upgradeSubtitle')}
          buttonText={t('lockedOverlay.upgradeNow')}
          onPress={() => {
            setShowLockedOverlay(false);
            setTimeout(() => setShowPaywall(true), 250);
          }}
          onClose={() => setShowLockedOverlay(false)}
        />
      )}

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 12,
    paddingTop: 24,
    paddingBottom: 120,
  },
  renderItem: {
    width: '100%',
  },
  emptyContainer: {
    marginTop: 80,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
});
