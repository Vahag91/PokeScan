import React, { useState, useRef, useMemo, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { foilOrder } from '../../constants';
import { getPriceColor } from '../../utils';
import { MarketLinkButton, MarketSegmentedControl, FoilPickerModal } from '.';
import StatCard from './StatCard';
import { ThemeContext } from '../../context/ThemeContext';

export default function MarketOverview({
  tcgplayer,
  cardmarket,
  loading = false,
}) {
  const { theme } = useContext(ThemeContext);
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
  const [showFoilDropdown, setShowFoilDropdown] = useState(false);

  useEffect(() => {
    if (!availableFoils.includes(selectedFoil)) {
      setSelectedFoil(availableFoils[0] || '');
    }
  }, [availableFoils]);

  if (!market) return null;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {[...Array(4)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.skeletonCard,
              { backgroundColor: theme.inputBackground },
            ]}
          />
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

  const trendColor = ['Price Trend', 'Market Price'].includes(mainLabel)
    ? { color: '#4CAF50' }
    : { color: theme.text };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <MarketSegmentedControl
        available={available}
        activeTab={activeTab}
        setActiveTab={tab => {
          setShowFoilDropdown(false);
          setActiveTab(tab);
        }}
      />

      {isTCG && availableFoils.length > 1 && (
        <FoilPickerModal
          selectedFoil={selectedFoil}
          availableFoils={availableFoils}
          showDropdown={showFoilDropdown}
          setShowDropdown={setShowFoilDropdown}
          onSelectFoil={setSelectedFoil}
          theme={theme}
        />
      )}

      <Animated.View
        style={[
          styles.mainCard,
          { backgroundColor: theme.card, transform: [{ scale }] },
        ]}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={styles.mainPressable}
        >
          <Text style={[styles.mainStatLabel, { color: theme.text }]}>
            {mainLabel}
          </Text>
          <Text style={[styles.mainStatValue, trendColor]}>{mainValue}</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.subCardsContainer}>
        {subStats.map(([l, v]) => (
          <StatCard
            key={l}
            label={l}
            value={v}
            theme={theme}
            textColor={getPriceColor(
              l,
              v,
              activeTab === 'tcgplayer' ? prices[selectedFoil] : prices,
            )}
          />
        ))}
      </View>

      <Text style={[styles.updatedAt, { color: theme.mutedText }]}>
        Last updated: {new Date().toISOString().split('T')[0]}
      </Text>

      <MarketLinkButton
        scale={scale}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        url={market.url}
        activeTab={activeTab}
        theme={theme}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    padding: 12,
    borderRadius: 12,
  },
  dropdownWrapper: {
    alignSelf: 'flex-start',
    width: '100%',
  },
  foilSelector: {
    marginBottom: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  foilSelectorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dropdownList: {
    position: 'absolute',
    top: 36,
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  mainCard: {
    marginVertical: 8,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  mainPressable: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainStatLabel: {
    fontSize: 18,
    fontWeight: '600',
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
  updatedAt: {
    fontSize: 10,
    textAlign: 'right',
    marginTop: 8,
  },
  skeletonCard: {
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
});
