import React from 'react';
import {
  Animated,
  TouchableOpacity,
  Text,
  StyleSheet,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function MarketLinkButton({
  scale,
  onPressIn,
  onPressOut,
  url,
  activeTab,
  theme,
}) {
  const { t } = useTranslation();
  const label = activeTab === 'cardmarket' ? t('scanner.viewOnCardmarket') : t('scanner.viewOnTCGPlayer');

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.marketButton, { backgroundColor: theme.primary }]}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={() => Linking.openURL(url)}
      >
        <Ionicons
          name="open-outline"
          size={18}
          color={theme.text}
          style={styles.iconLeft}
        />
        <Text style={[styles.marketButtonText, { color: theme.mutedText }]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  marketButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  marketButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  iconLeft: {
    marginRight: 8,
    marginTop: 1,
  },
});