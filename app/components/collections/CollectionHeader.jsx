import React, { useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { globalStyles } from '../../../globalStyles';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.52;
const CARD_HEIGHT = 90;

export function CollectionHeader({ collections }) {
  const scaleAnims = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;

  const summary = useMemo(() => {
    const totalCollections = collections.length;
    const totalCards = collections.reduce(
      (sum, c) => sum + (c.cardCount || 0),
      0,
    );
    const totalValue = collections.reduce(
      (sum, c) => sum + (c.totalValue || 0),
      0,
    );
    return { totalCollections, totalCards, totalValue };
  }, [collections]);

  const formatValue = value => {
    return `$${new Intl.NumberFormat('en-US').format(value.toFixed(0))}`;
  };

  const formatNumber = num => new Intl.NumberFormat('en-US').format(num);

  const cards = [
    {
      icon: 'albums-outline',
      label: 'Collections',
      value: formatNumber(summary.totalCollections),
      gradient: ['#4F46E5', '#6366F1'],
    },
    {
      icon: 'layers-outline',
      label: 'Cards',
      value: formatNumber(summary.totalCards),
      gradient: ['#2563EB', '#3B82F6'],
    },
    {
      icon: 'cash-outline',
      label: 'Total Value',
      value: formatValue(summary.totalValue),
      gradient: ['#DB2777', '#EC4899'],
    },
  ];

  const handlePress = (index, toValue) => {
    Animated.spring(scaleAnims[index], {
      toValue,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };

  return (
    <View style={styles.container}>
      <Text style={globalStyles.text}>My Collections</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 16}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContainer}
      >
        {cards.map((card, index) => (
          <TouchableWithoutFeedback
            key={card.label}
            onPressIn={() => handlePress(index, 0.97)}
            onPressOut={() => handlePress(index, 1)}
          >
            <Animated.View
              style={[
                styles.card,
                {
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                  transform: [{ scale: scaleAnims[index] }],
                },
              ]}
            >
              <LinearGradient
                colors={card.gradient}
                style={styles.iconBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name={card.icon} size={18} color="#fff" />
              </LinearGradient>

              <View style={styles.cardText}>
                <Text
                  style={styles.value}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {card.value}
                </Text>
                <Text style={styles.label}>{card.label}</Text>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  headerText: {
    fontSize: 21,
    color: '#111827',
    marginLeft: 20,
    marginBottom: 12,
  },
  scrollContainer: {
    paddingLeft: 20,
    paddingRight: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardText: {
    flex: 1,
  },
  value: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
});
