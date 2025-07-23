import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH * 0.8;

export default function CardPreview({ cardName, cardData }) {
  const navigation = useNavigation();

  if (!cardName && !cardData) return null;

  const handlePress = () => {
    if (cardData?.id) {
      navigation.navigate('SingleCardScreen', { cardId: cardData.id });
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      {cardName && !cardData && (
        <View style={styles.detectionBadge}>
          <Text style={styles.detectionText}>Detected:</Text>
          <Text style={styles.detectionHighlight}>{cardName}</Text>
        </View>
      )}

      {cardData && (
        <View style={styles.card}>
          <View style={styles.accentBar} />

          <Image
            source={{ uri: cardData.images.small }}
            style={styles.image}
            resizeMode="cover"
          />

          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
              {cardData.name}
            </Text>

            <View style={styles.detailRow}>
              <Text style={styles.label}>HP:</Text>
              <Text style={styles.value}>{cardData.hp}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Type:</Text>
              <View style={styles.badgesWrapper}>
                {cardData.types?.map(type => (
                  <View key={type} style={styles.typeBadge}>
                    <Text style={styles.badgeText}>{type}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Rarity:</Text>
              <View style={styles.rarityBadge}>
                <Text style={styles.badgeText}>
                  {cardData.rarity || 'Unknown'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    paddingVertical: 2,
    paddingHorizontal: 16,
  },
  detectionBadge: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#0EA5E9',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  detectionText: {
    color: '#E0F2FE',
    fontSize: 13,
    fontWeight: '500',
    marginRight: 6,
  },
  detectionHighlight: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  accentBar: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#38BDF8',
    marginRight: 10,
  },
  image: {
    width: 64,
    height: 96,
    borderRadius: 8,
    marginRight: 14,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  label: {
    fontSize: 13,
    color: '#E5E7EB',
    fontWeight: '600',
    width: 50,
  },
  value: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  badgesWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeBadge: {
    backgroundColor: '#38BDF8',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 4,
  },
  rarityBadge: {
    backgroundColor: '#FACC15',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
  },
});
