import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { rarityColors, typeIcons } from '../../constants';
import { getCardPrice } from '../../utils';
import { ThemeContext } from '../../context/ThemeContext';
import { globalStyles } from '../../../globalStyles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;
const IMAGE_HEIGHT = CARD_WIDTH * 1.35;

function RenderSearchSingleCard({
  item,
  showCardNumber = false,
  selectedLanguage = 'en',
  imageProps = null,
}) {
  const nav = useNavigation();
  const price = getCardPrice(item);
  const rarityColor = rarityColors[item.rarity] || '#bdbdbd';
  const { theme } = useContext(ThemeContext);
  const { style: imageStyleProp, ...restImageProps } = imageProps || {};

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={() => nav.push('SingleCardScreen', { cardId: item.id, language: selectedLanguage })}
      activeOpacity={0.9}
    >
      <View style={[styles.cardShadow, { shadowColor: theme.shadowColor || '#000' }]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.cardBorder || '#e5e7eb',
            },
          ]}
        >
          <View style={styles.imageBox}>
            <Image
              source={
                typeof item.images.small === 'string'
                  ? { uri: item.images.small }
                  : item.images.small
              }
              style={[styles.cardImage, imageStyleProp]}
              {...restImageProps}
            />

            {item.rarity && (
              <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
                <Text style={styles.rarityText}>{item.rarity}</Text>
              </View>
            )}
          </View>

          <View style={styles.infoSection}>
            <View style={styles.topRow}>
              <Text
                style={[globalStyles.body, styles.cardName, { color: theme.text }]}
                numberOfLines={1}
                flex={1}
              >
                {item.name}
              </Text>
              <View style={styles.typeIconRow}>
                {item.types?.map(type => (
                  <Image key={type} source={typeIcons[type]} style={styles.typeIcon} />
                ))}
              </View>
            </View>

            <View style={styles.bottomRow}>
              {showCardNumber && (
                <Text
                  style={[
                    globalStyles.smallText,
                    styles.cardNumber,
                    { color: theme.mutedText },
                  ]}
                  numberOfLines={1}
                >
                  {selectedLanguage === 'jp' ? `#${item.number}` : `#${item.number}/${item.set.total}`}
                </Text>
              )}
              <Text
                style={[
                  globalStyles.subheading,
                  styles.priceText,
                  {
                    // backgroundColor: theme.greenBadgeBackground,
                    color: theme.greenBadgeText || '#388e3c',
                  },
                ]}
              >
                {price == null ? '—' : `$${price.toFixed(2)}`}
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
    backgroundColor: 'transparent',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
  },
  imageBox: {
    position: 'relative',
    width: '100%',
    height: IMAGE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  rarityBadge: {
    position: 'absolute',
    bottom: 0,
    right: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 50,
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
    fontFamily: 'Lato-Bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  infoSection: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardName: {
    fontSize: 15,
    fontFamily: 'Lato-Bold',
    flex: 1,
    marginRight: 8,
  },
  cardNumber: {
    fontSize: 12,
    fontFamily: 'Lato-Regular',
  },
  bottomRow: {
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
    paddingHorizontal: 4,
    fontSize: 15,
    borderRadius: 6,
    overflow: 'hidden',
    lineHeight: 22,
  },
});
