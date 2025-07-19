import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { rarityColors, typeIcons } from '../../constants';
import { getCardPrice } from '../../utils';
import { FasterImageView } from '@rraut/react-native-faster-image';


const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;
const IMAGE_HEIGHT = CARD_WIDTH * 1.35;

function RenderSearchSingleCard({ item, showCardNumber = false }) {
  const nav = useNavigation();
  const rarityColor = rarityColors[item.rarity] || '#bdbdbd';
  const price = getCardPrice(item);

console.log(item,"item");

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={() => nav.push('SingleCardScreen', { cardId: item.id })}
      activeOpacity={0.9}
    >
      <View style={styles.cardShadow}>
        <View style={styles.card}>
          {/* Card Image */}
          <View style={styles.imageBox}>
            <FasterImageView
              source={
                typeof item.images.small === 'string'
                  ? { uri: item.images.small }
                  : item.images.small
              }
              style={styles.cardImage}
            />
            {item.rarity && (
              <View
                style={[styles.rarityBadge, { backgroundColor: rarityColor }]}
              >
                <Text style={styles.rarityText}>{item.rarity}</Text>
              </View>
            )}
          </View>

          {/* Card Info */}
          <View style={styles.infoSection}>
            <View style={styles.nameNumber}>
            <Text style={styles.cardName} numberOfLines={1}>
              {item.name}
            </Text>
            {showCardNumber && (
              <Text style={styles.cardNumber}>
                #{item.number}/{item.set.total}
              </Text>
            )}
            </View>

            <View style={styles.footerRow}>
              {/* Type Icons */}
              <View style={styles.typeIconRow}>
                {item.types?.map(type => (
                  <Image
                    key={type}
                    source={typeIcons[type]}
                    style={styles.typeIcon}
                  />
                ))}
              </View>

              <Text style={styles.priceText}>
                ${price?.toFixed(2) || '0.00'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
export default React.memo(RenderSearchSingleCard);

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH + 8,
    marginBottom: 4,
  },
  cardShadow: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    backgroundColor: 'transparent',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
  },
  imageBox: {
    position: 'relative',
    width: '100%',
    height: IMAGE_HEIGHT,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 5,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  nameNumber:{
flexDirection:"row",
justifyContent:"space-between",
alignItems:"center"
  },
  rarityBadge: {
    position: 'absolute',
    bottom: 0,
    right: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 50,
    backgroundColor: '#aaa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#ffffffcc',
  },

  rarityText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    textTransform: 'uppercase',
  },
  infoSection: {
    // padding: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 3,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeIconRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeIcon: {
    width: 20,
    height: 20,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#388e3c',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  cardNumber: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: -2,
    textAlign: 'left',
  },
});
