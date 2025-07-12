import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Animated,
  Image,
  FlatList,
  Modal,
} from 'react-native';
import { foilOrder } from '../../constants';
import { getPriceColor } from '../../utils';
const icons = {
  tcgplayer: require('../../assets/cards/other/tcgplayer.webp'),
  cardmarket: require('../../assets/cards/other/cardmarket.webp'),
};

function formatFoilLabel(key) {
  if (!key) return '';
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^1stEdition/, '1st Edition')
    .replace(/^unlimited/, 'Unlimited')
    .replace(/^normal/, 'Normal')
    .replace(/^holofoil/, 'Holofoil')
    .replace(/^reverse Holofoil/, 'Reverse Holofoil')
    .replace(/^etched Holofoil/, 'Etched Holofoil')
    .replace(/^promo Holofoil/, 'Promo Holofoil');
}

function StatCard({ label, value, textColor = styles.defaultColor }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, textColor]}>{value}</Text>
    </View>
  );
}



export default function MarketOverview({
  tcgplayer,
  cardmarket,
  loading = false,
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  const available = [];
  if (tcgplayer?.prices) available.push('tcgplayer');
  if (cardmarket?.prices) available.push('cardmarket');

  const [activeTab, setActiveTab] = useState(available[0] || null);
  const market = activeTab === 'tcgplayer' ? tcgplayer : cardmarket;
  const prices = useMemo(() => market?.prices || {}, [market]);
  const isTCG = activeTab === 'tcgplayer';

  const availableFoils = useMemo(() => {
    return activeTab === 'tcgplayer'
      ? foilOrder.filter(key => prices[key])
      : [];
  }, [activeTab, prices]);

  const [selectedFoil, setSelectedFoil] = useState(availableFoils[0] || '');
  const [foilPickerVisible, setFoilPickerVisible] = useState(false);

  useEffect(() => {
    if (!availableFoils.includes(selectedFoil)) {
      setSelectedFoil(availableFoils[0] || '');
    }
  }, [availableFoils, selectedFoil]);

  if (!market) return null;

  if (loading) {
    return (
      <View style={styles.container}>
        {[...Array(4)].map((_, i) => (
          <View key={i} style={styles.skeletonCard} />
        ))}
      </View>
    );
  }

  const stats =
    activeTab === 'tcgplayer'
      ? (() => {
          const tier = prices[selectedFoil] || {};
          return [
            ['Mid Price', tier.mid != null ? `$${tier.mid.toFixed(2)}` : '–'],
            ['Low Price', tier.low != null ? `$${tier.low.toFixed(2)}` : '–'],
            [
              'High Price',
              tier.high != null ? `$${tier.high.toFixed(2)}` : '–',
            ],
            [
              'Market Price',
              tier.market != null ? `$${tier.market.toFixed(2)}` : '–',
            ],
            [
              'Direct Low',
              tier.directLow != null ? `$${tier.directLow.toFixed(2)}` : '–',
            ],
          ];
        })()
      : (() => {
          const cm = market.prices;
          return [
            [
              'Avg Sell',
              cm.averageSellPrice != null
                ? `$${cm.averageSellPrice.toFixed(2)}`
                : '–',
            ],
            [
              'Low Price',
              cm.lowPrice != null ? `$${cm.lowPrice.toFixed(2)}` : '–',
            ],
            [
              'Trend',
              cm.trendPrice != null ? `$${cm.trendPrice.toFixed(2)}` : '–',
            ],
            ['1D Avg', cm.avg1 != null ? `$${cm.avg1.toFixed(2)}` : '–'],
            ['7D Avg', cm.avg7 != null ? `$${cm.avg7.toFixed(2)}` : '–'],
            ['30D Avg', cm.avg30 != null ? `$${cm.avg30.toFixed(2)}` : '–'],
            [
              'German Low',
              cm.germanProLow != null ? `$${cm.germanProLow.toFixed(2)}` : '–',
            ],
            [
              'Suggested',
              cm.suggestedPrice > 0 ? `$${cm.suggestedPrice.toFixed(2)}` : '–',
            ],
          ];
        })();

  const mainIndex = activeTab === 'tcgplayer' ? 3 : 2;
  const [label, value] = stats[mainIndex];
  const mainLabel = label === 'Trend' ? 'Price Trend' : label;
  const mainValue = value;
  const subStats = stats.filter((_, i) => i !== mainIndex).slice(0, 3);

  const highlightColor = styles.positiveColor;
  const trendColor =
    mainLabel === 'Price Trend' || mainLabel === 'Market Price'
      ? highlightColor
      : styles.defaultColor;

  return (
    <View style={styles.container}>
      <View style={styles.segmentedControl}>
        {available.map(src => (
          <TouchableOpacity
            key={src}
            style={[styles.segment, activeTab === src && styles.segmentActive]}
            onPress={() => setActiveTab(src)}
          >
            <Image
              source={icons[src]}
              style={[
                styles.tabIcon,
                activeTab === src && styles.tabIconActive,
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {isTCG && availableFoils.length > 1 && (
        <TouchableOpacity
          onPress={() => setFoilPickerVisible(true)}
          style={styles.foilSelector}
        >
          <Text style={styles.foilSelectorText}>
            {formatFoilLabel(selectedFoil)} ▼
          </Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={foilPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFoilPickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <FlatList
              data={availableFoils}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedFoil(item);
                    setFoilPickerVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>
                    {formatFoilLabel(item)}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <Animated.View style={[styles.mainCard, { transform: [{ scale }] }]}>
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={styles.mainPressable}
        >
          <Text style={styles.mainStatLabel}>{mainLabel}</Text>
          <Text style={[styles.mainStatValue, trendColor]}>{mainValue}</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.subCardsContainer}>
        {subStats.map(([l, v]) => (
      <StatCard
  key={l}
  label={l}
  value={v}
  textColor={getPriceColor(
    l,
    v,
    activeTab === 'tcgplayer' ? prices[selectedFoil] : prices,
  )}
/>

        ))}
      </View>

      <Text style={styles.updatedAt}>Last updated: {market.updatedAt}</Text>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => Linking.openURL(market.url)}
      >
        <Text style={styles.actionText}>
          View on {activeTab === 'cardmarket' ? 'Cardmarket' : 'TCGPlayer'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const PRIMARY = '#007AFF';
const BG = '#F9F9FB';
const CARD_BG = '#FFFFFF';
const TEXT = '#333333';
const MUTED = '#888888';

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    padding: 12,
    backgroundColor: BG,
    borderRadius: 12,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#EEE',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: CARD_BG,
  },
  tabIcon: {
    width: 20,
    height: 20,
    marginBottom: 4,
    tintColor: MUTED,
  },
  tabIconActive: {
    tintColor: PRIMARY,
  },
  foilSelector: {
    marginBottom: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#EEE',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  foilSelectorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  mainCard: {
    marginVertical: 8,
    backgroundColor: CARD_BG,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  mainPressable: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainStatLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT,
    marginBottom: 6,
  },
  mainStatValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  subCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginVertical: 8,
  },
  statCard: {
    flex: 1,
    padding: 12,
    backgroundColor: CARD_BG,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: 12,
    color: MUTED,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  updatedAt: {
    fontSize: 10,
    color: MUTED,
    textAlign: 'right',
    marginTop: 8,
  },
  actionButton: {
    marginTop: 12,
    paddingVertical: 12,
    backgroundColor: PRIMARY,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  skeletonCard: {
    height: 80,
    backgroundColor: '#DDD',
    borderRadius: 8,
    marginBottom: 8,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '40%',
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  modalItemText: {
    fontSize: 14,
    color: TEXT,
  },
  positiveColor: { color: '#4CAF50' },
  negativeColor: { color: '#E53935' },
  warningColor: { color: '#FF9800' },
  specialColor: { color: '#2196F3' },
  defaultColor: { color: TEXT },
});
