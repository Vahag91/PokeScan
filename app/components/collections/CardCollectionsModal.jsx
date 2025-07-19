import React, { useEffect, useState } from 'react';
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
import {
  getDBConnection,
  getAllCollections,
  getCollectionCountsForCard, 
  addCardToCollection,
  removeCardFromCollectionByRowId, 
} from '../../lib/db';

export default function CardCollectionsModal({
  visible,
  onClose,
  card,
  onChange,
}) {
  const [collections, setCollections] = useState([]);
  const [collectionCounts, setCollectionCounts] = useState({});
  const [loading, setLoading] = useState(false);

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
    const counts = await getCollectionCountsForCard(db, card?.id); // ✅ Get map {collectionId: quantity}

    setCollections(all);
    setCollectionCounts(counts);
    setLoading(false);
  };

  const increment = async (collectionId) => {
    try {
      await addCardToCollection(card, collectionId);      
      setCollectionCounts((prev) => ({
        ...prev,
        [collectionId]: (prev[collectionId] || 0) + 1,
      }));
      if (onChange) onChange();
    } catch (err) {
      console.error('Add copy error:', err);
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
          await removeCardFromCollectionByRowId(db, row.rowid,collectionId);
          setCollectionCounts((prev) => ({
            ...prev,
            [collectionId]: prev[collectionId] - 1,
          }));
          if (onChange) onChange();
        }
      }
    } catch (err) {
      console.error('Remove copy error:', err);
    }
  };

  const renderItem = ({ item }) => {
    const count = collectionCounts[item.id] || 0;

    return (
      <View style={styles.item}>
        <Text style={styles.itemText}>
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
              color={count > 0 ? '#EF4444' : '#ccc'}
            />
          </TouchableOpacity>
          <Text style={styles.countText}>x{count}</Text>
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
        <View style={styles.modal}>
          <Text style={styles.title}>Add to Collections</Text>
          {loading ? (
            <Text style={styles.loadingText}>Loading...</Text>
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
            <Text style={styles.doneText}>Done</Text>
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    padding: 20,
    maxHeight: '70%',
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
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
  loadingText: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
    color: '#666',
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
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