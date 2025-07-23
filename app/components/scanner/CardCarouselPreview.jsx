import React, { useRef, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH * 0.75;
const CARD_SPACING = 16;
const FULL_CARD_WIDTH = CARD_WIDTH + CARD_SPACING;

export default function CardCarouselPreview({ cards }) {
  const navigation = useNavigation();
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showArrows, setShowArrows] = useState(true);
  const leftArrowOpacity = useRef(new Animated.Value(0)).current;
  const rightArrowOpacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Show/hide arrows based on position
    Animated.timing(leftArrowOpacity, {
      toValue: currentIndex > 0 ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    Animated.timing(rightArrowOpacity, {
      toValue: currentIndex < cards.length - 1 ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [currentIndex, cards.length]);

  const handleNavigate = cardId => {
    navigation.navigate('SingleCardScreen', { cardId });
  };

  const scrollToCard = index => {
    if (index >= 0 && index < cards.length) {
      flatListRef.current.scrollToIndex({ index, animated: true });
      setCurrentIndex(index);
      setShowArrows(false);
      setTimeout(() => setShowArrows(true), 300);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleNavigate(item.id)}
      style={styles.cardWrapper}
      activeOpacity={0.88}
    >
      <View style={styles.card}>
        <Image source={{ uri: item.images.small }} style={styles.image} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.detailRow}>
            <Text style={styles.label}>HP:</Text>
            <Text style={styles.value}>{item.hp}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Type:</Text>
            <View style={styles.badgesWrapper}>
              {item.types?.map(type => (
                <View key={type} style={styles.typeBadge}>
                  <Text style={styles.badgeText}>{type}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Rarity:</Text>
            <View style={styles.rarityBadge}>
              <Text style={styles.badgeText}>{item.rarity || 'Unknown'}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={cards}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2,
        }}
        onMomentumScrollEnd={e => {
          const index = Math.round(
            e.nativeEvent.contentOffset.x / FULL_CARD_WIDTH,
          );
          setCurrentIndex(index);
        }}
        getItemLayout={(_, index) => ({
          length: FULL_CARD_WIDTH,
          offset: FULL_CARD_WIDTH * index,
          index,
        })}
        initialScrollIndex={0}
        scrollEventThrottle={16}
        snapToInterval={FULL_CARD_WIDTH}
        decelerationRate="fast"
      />

      <Animated.View
        style={[
          styles.arrowButton,
          styles.leftArrow,
          {
            opacity: leftArrowOpacity,
            transform: [
              {
                translateX: leftArrowOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 0],
                }),
              },
            ],
          },
        ]}
        pointerEvents={currentIndex > 0 ? 'auto' : 'none'}
      >
        <TouchableOpacity
          onPress={() => scrollToCard(currentIndex - 1)}
          style={styles.arrowTouchable}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[
          styles.arrowButton,
          styles.rightArrow,
          {
            opacity: rightArrowOpacity,
            transform: [
              {
                translateX: rightArrowOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
          },
        ]}
        pointerEvents={currentIndex < cards.length - 1 ? 'auto' : 'none'}
      >
        <TouchableOpacity
          onPress={() => scrollToCard(currentIndex + 1)}
          style={styles.arrowTouchable}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={28} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginRight: CARD_SPACING - 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  image: {
    width: 70,
    height: 100,
    borderRadius: 10,
    marginRight: 16,
    backgroundColor: '#1E293B',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
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
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    color: '#CBD5E1',
    fontWeight: '600',
    width: 54,
  },
  value: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
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
    color: '#101722ff',
  },
  arrowButton: {
    position: 'absolute',
    top: '36%',
    backgroundColor: '#10B981',
    borderRadius: 30,
    width: 37,
    height: 37,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  leftArrow: {
    left: 20,
  },
  rightArrow: {
    right: 20,
  },
  arrowTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
