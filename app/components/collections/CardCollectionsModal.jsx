import React, { useEffect, useState, useContext } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Pressable,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import {
  getDBConnection,
  getAllCollections,
  getCollectionCountsForCard,
  addCardToCollection,
  removeCardFromCollectionByRowId,
} from '../../lib/db';
import { ThemeContext } from '../../context/ThemeContext';
import RateUsService from '../../services/RateUsService';
export default function CardCollectionsModal({
  visible,
  onClose,
  card,
  onChange,
  onRateUsTrigger,
  language = 'en',
}) {
  const { t } = useTranslation();
  const [collections, setCollections] = useState([]);
  const [collectionCounts, setCollectionCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    if (visible) {
      loadCollections();
    } else {
      setCollectionCounts({});
    }
  }, [visible]);

  const loadCollections = async () => {
    setLoading(true);
    const db = await getDBConnection();
    const all = await getAllCollections(db);
    const counts = await getCollectionCountsForCard(db, card?.id);
    setCollections(all);
    setCollectionCounts(counts);
    setLoading(false);
  };

  const increment = async (collectionId) => {
    try {

      
      await addCardToCollection(card, collectionId, language);
      setCollectionCounts((prev) => ({
        ...prev,
        [collectionId]: (prev[collectionId] || 0) + 1,
      }));
      if (onChange) onChange();
      
      // Show native rating dialog after adding card to collection (production behavior)
      setTimeout(async () => {
        const shouldShow = await RateUsService.shouldShowRatePrompt();
        if (shouldShow) {
          await RateUsService.showRatePrompt();
        }
      }, 1000);
    } catch (_) {
    }
  };

  const decrement = async (collectionId) => {
    try {
      const db = await getDBConnection();
      const currentCount = collectionCounts[collectionId] || 0;

      if (currentCount > 0) {
        const results = await db.executeSql(
          `SELECT rowid FROM collection_cards WHERE cardId = ? AND collectionId = ? LIMIT 1`,
          [card.id, collectionId]
        );
        const row = results[0].rows.item(0);
        if (row?.rowid) {
          await removeCardFromCollectionByRowId(db, row.rowid, collectionId);
          setCollectionCounts((prev) => ({
            ...prev,
            [collectionId]: prev[collectionId] - 1,
          }));
          if (onChange) onChange();
        }
      }
    } catch (_) {
    }
  };

  const renderItem = ({ item }) => {
    const count = collectionCounts[item.id] || 0;

    return (
      <View style={styles.item}>
        <Text style={[styles.itemText, { color: theme.text }]}>
          {item.name} {count > 0 ? `x${count}` : ''}
        </Text>
        <View style={styles.counter}>
          <TouchableOpacity
            onPress={() => decrement(item.id)}
            disabled={count === 0}
          >
            <Ionicons
              name="remove-circle-outline"
              size={24}
              color={count > 0 ? '#EF4444' : theme.mutedText}
            />
          </TouchableOpacity>
          <Text style={[styles.countText, { color: theme.text }]}>
            x{count}
          </Text>
          <TouchableOpacity onPress={() => increment(item.id)}>
            <Ionicons name="add-circle-outline" size={24} color="#10B981" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.modalWrapper}>
        <Pressable style={styles.overlay} onPress={onClose} />
        <View
          style={[
            styles.modal,
            { backgroundColor: theme.inputBackground, borderTopColor: theme.border },
          ]}
        >
          <Text style={[styles.title, { color: theme.text }]}>
            {t('collections.addToCollections')}
          </Text>
          {loading ? (
            <Text style={[styles.loadingText, { color: theme.mutedText }]}>
              {t('common.loading')}
            </Text>
          ) : (
            <FlatList
              data={collections}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={{ paddingVertical: 8 }}
            />
          )}
          <TouchableOpacity
            style={[styles.doneButton, loading && { opacity: 0.5 }]}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.doneText}>{t('common.done')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modal: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    padding: 20,
    maxHeight: '70%',
    borderTopWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  item: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemText: {
    fontSize: 16,
  },
  loadingText: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countText: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 28,
    textAlign: 'center',
  },
  doneButton: {
    marginTop: 16,
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});