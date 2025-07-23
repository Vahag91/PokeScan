import React, { useRef, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import RNFS from 'react-native-fs';
import EditCollectionMenu from './EditCollectionMenu';
import { ThemeContext } from '../../context/ThemeContext';
import { globalStyles } from '../../../globalStyles';
export default function CollectionCard({
  item,
  onPress,
  onEditPress,
  onDelete,
}) {
  const { theme } = useContext(ThemeContext);
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }),
      Animated.timing(opacity, {
        toValue: 0.9,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onPressOut = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getFullPath = filename =>
    filename ? `file://${RNFS.DocumentDirectoryPath}/${filename}` : null;

  const getDaysAgo = dateString => {
    if (!dateString) return '';
    const days = Math.floor(
      (Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24),
    );
    return days === 0 ? 'Today' : `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <View style={styles.cardContainer}>
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            backgroundColor: theme.cardCollectionBackground,
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <View style={styles.topRightMenu}>
          <EditCollectionMenu
            onDelete={onDelete}
            onEditPress={onEditPress}
            item={item}
          />
        </View>

        <TouchableOpacity
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={0.9}
          style={styles.touchable}
        >
          {item.isFavorite && (
            <View style={styles.starBadge}>
              <Ionicons name="star" size={16} color="#FACC15" />
            </View>
          )}

          <View style={styles.previewSection}>
            {item.previewCards?.length > 0 ? (
              item.previewCards.slice(0, 3).map((filename, idx) => (
                <Image
                  key={idx}
                  source={{ uri: getFullPath(filename) }}
                  style={[
                    styles.previewImage,
                    {
                      left: idx * 24,
                      zIndex: 10 - idx,
                      transform: [{ rotate: `${idx % 2 === 0 ? -4 : 3}deg` }],
                    },
                  ]}
                />
              ))
            ) : (
              <View
                style={[
                  styles.noPreview,
                  { backgroundColor: theme.inputBackground },
                ]}
              >
                <Ionicons name="image-outline" size={22} color={theme.border} />
              </View>
            )}

            {item.previewCards?.length > 3 && (
              <View style={styles.extraBadge}>
                <Text style={styles.extraText}>+{item.previewCards.length - 3}</Text>
              </View>
            )}
          </View>

          <View style={styles.info}>
            <View style={styles.headerRow}>
              <Ionicons
                name="folder-open-outline"
                size={18}
                color="#6366F1"
                style={{ marginRight: 8 }}
              />
              <Text
                style={[globalStyles.subheading, styles.titleText, { color: theme.text }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
            </View>

            <Text
              style={[globalStyles.caption, styles.timestamp, { color: theme.mutedText }]}
            >
              Last updated: {getDaysAgo(item.updatedAt || item.createdAt)}
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="layers-outline" size={14} color={theme.mutedText} />
                <Text
                  style={[globalStyles.smallText, styles.metaText, { color: theme.mutedText }]}
                >
                  {item.cardCount} {item.cardCount === 1 ? 'card' : 'cards'}
                </Text>
              </View>

              <View style={styles.metaItem}>
                <Ionicons name="pricetag-outline" size={14} color={theme.mutedText} />
                <Text
                  style={[globalStyles.smallText, styles.metaText, { color: theme.mutedText }]}
                >
                  {item.totalValue ? `$${item.totalValue.toFixed(2)}` : 'No value'}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 10,
    marginVertical: 8,
  },
  cardWrapper: {
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
    position: 'relative',
    padding: 16,
  },
  touchable: {
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  starBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#FEF9C3',
    padding: 4,
    borderRadius: 12,
    zIndex: 99,
  },
  topRightMenu: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 999,
    padding: 6,
  },
  previewSection: {
    width: 100,
    height: 72,
    position: 'relative',
    marginRight: 16,
  },
  previewImage: {
    position: 'absolute',
    width: 58,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  extraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6366F1',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  extraText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  noPreview: {
    width: 48,
    height: 66,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleText: {
    flex: 1,
  },
  timestamp: {
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    marginLeft: 4,
  },
});