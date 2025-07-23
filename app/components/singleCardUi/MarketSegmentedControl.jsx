import React, { useContext } from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';

const icons = {
  tcgplayer: require('../../assets/cards/other/tcgplayericon.png'),
  cardmarket: require('../../assets/cards/other/cardmarket.webp'),
};

export default function MarketSegmentedControl({
  available,
  activeTab,
  setActiveTab,
}) {
  const { theme } = useContext(ThemeContext);

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.inputBackground }]}>
      {available.map((src) => {
        const isActive = activeTab === src;
        return (
          <TouchableOpacity
            key={src}
            style={[
              styles.segment,
              isActive && {
                backgroundColor: theme.background,
                shadowColor: theme.text,
              },
            ]}
            onPress={() => setActiveTab(src)}
            activeOpacity={0.8}
          >
            <Image
              source={icons[src]}
              style={[
                styles.icon,
                src === 'cardmarket' && { tintColor: isActive ? theme.text : theme.mutedText },
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
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: '100%',
    height: 28,
  },
});