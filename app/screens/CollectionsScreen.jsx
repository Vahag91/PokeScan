import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CreateCollectionModal from '../components/collections/CreateCollectionModal';
import EditCollectionModal from '../components/collections/EditCollectionModal';
import AddCollectionCard from '../components/collections/AddCollectionCard';
import {
  getDBConnection,
  getAllCollectionsWithPreviewCards,
  renameCollection,
  deleteCollection,
} from '../lib/db';
import { useFocusEffect } from '@react-navigation/native';
import CollectionCard from '../components/collections/CollectionCard';
import { CollectionHeader } from '../components/collections/CollectionHeader';

export default function CollectionsScreen({ navigation }) {
  const [collections, setCollections] = useState([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];

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

useEffect(() => {
  loadCollections();
}, [loadCollections]);

useEffect(() => {
  Animated.parallel([
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }),
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
  ]).start();
}, [fadeAnim, scaleAnim]);
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

  const handleDelete = async collection => {
    const db = await getDBConnection();
    await deleteCollection(db, collection.id);
    setEditModalVisible(false);
    setEditingCollection(null);
    loadCollections();
  };

  const renderItem = ({ item, index }) => {
    if (item.isAddCard) {
      return (
        <View style={styles.renderItem}>
          <AddCollectionCard onPress={() => setCreateModalVisible(true)} />
        </View>
      );
    }

    return (
      <View style={styles.renderItem}>
        <CollectionCard
          item={item}
          index={index}
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
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
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
            <Ionicons name="folder-open-outline" size={60} color="#CBD5E1" />
            <Text style={styles.emptyText}>Nothing here yet...</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to create your first collection.
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  list: {
    paddingHorizontal: 8,
    paddingBottom: 100,
    paddingTop:25
  },
renderItem: {
width:"100%"
},
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },

  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
  },

  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
});
