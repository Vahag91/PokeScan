import React, { useEffect, useState, useCallback, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Animated,
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
import { ThemeContext } from '../context/ThemeContext';
import { globalStyles } from '../../globalStyles';
export default function CollectionsScreen({ navigation }) {
  const { theme } = useContext(ThemeContext);

  const [collections, setCollections] = useState([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
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
    }, [loadCollections])
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
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const openEditModal = (collection) => {
    setEditingCollection(collection);
    setEditModalVisible(true);
  };

  const handleEditSave = async (newName) => {
    if (!newName.trim()) return;
    const db = await getDBConnection();
    await renameCollection(db, editingCollection.id, newName.trim());
    setEditModalVisible(false);
    setEditingCollection(null);
    loadCollections();
  };

  const handleDelete = async (collection) => {
    const db = await getDBConnection();
    await deleteCollection(db, collection.id);
    setEditModalVisible(false);
    setEditingCollection(null);
    loadCollections();
  };

  const renderItem = ({ item }) => {
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
        keyExtractor={(item) => item.id}
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
            <Text style={[globalStyles.text, styles.emptyText, { color: theme.text }]}>Nothing here yet...</Text>
            <Text
              style={[globalStyles.text, styles.emptySubtext, { color: theme.mutedText }]}
            >
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