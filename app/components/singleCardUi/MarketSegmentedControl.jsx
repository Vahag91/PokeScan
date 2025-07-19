import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';

const icons = {
  tcgplayer: require('../../assets/cards/other/tcgplayericon.png'),
  cardmarket: require('../../assets/cards/other/cardmarket.webp'),
};

const PRIMARY = '#0EA5E9'; // Sky-500
const BG = '#F1F5F9'; // slate-100
const ACTIVE_BG = '#FFFFFF';
const MUTED = '#94A3B8';

export default function MarketSegmentedControl({
  available,
  activeTab,
  setActiveTab,
}) {
  return (
    <View style={styles.wrapper}>
      {available.map((src) => {
        const isActive = activeTab === src;
        return (
          <TouchableOpacity
            key={src}
            style={[styles.segment, isActive && styles.activeSegment]}
            onPress={() => setActiveTab(src)}
            activeOpacity={0.8}
          >
            <Image
              source={icons[src]}
              style={[
                styles.icon,
                src === 'cardmarket' && styles.monochrome,
                src === 'cardmarket' && isActive && styles.monochromeActive,
              ]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    backgroundColor: BG,
    padding: 6,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    backgroundColor: 'transparent',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeSegment: {
    backgroundColor: ACTIVE_BG,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  icon: {
    width: "100%",
    height: 28,
  },
  monochrome: {
    tintColor: MUTED,
  },
  monochromeActive: {
    tintColor: PRIMARY,
  },
});