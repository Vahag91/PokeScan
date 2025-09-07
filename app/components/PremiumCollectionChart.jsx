import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import { ThemeContext } from '../context/ThemeContext';
import { SubscriptionContext } from '../context/SubscriptionContext';
import CollectionValueMiniChart from './collections/CollectionValueMiniChart';

export default function PremiumCollectionChart({ 
  collectionId, 
  onUpgradePress 
}) {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);
  const { isPremium } = useContext(SubscriptionContext);

  // If user is premium, show the chart normally
  if (isPremium) {
    return <CollectionValueMiniChart collectionId={collectionId} />;
  }

  // If user is not premium, show the locked state
  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      {/* Semi-transparent chart background */}
      <View style={styles.chartBackground}>
        <CollectionValueMiniChart collectionId={collectionId} />
      </View>
      
      {/* Lock overlay */}
      <View style={styles.lockOverlay}>
        {/* Blur background */}
        <BlurView
          style={styles.absoluteFill}
          blurType={theme.blurType || 'light'}
          blurAmount={0}
          reducedTransparencyFallbackColor={theme.blurFallback}
        />

        {/* Overlay gradient */}
        <LinearGradient
          colors={[theme.overlayDark, theme.overlayDarker]}
          style={styles.absoluteFill}
        />
      <View style={styles.lockIconContainer}>
        <Ionicons name="lock-closed" size={22} color="#8B5CF6" />
      </View>
      
      <Text style={[styles.title, { color: theme.text }]}>
        {t('cards.charts.collectionValueLocked')}
      </Text>
      
      <TouchableOpacity
        style={styles.upgradeButton}
        onPress={onUpgradePress}
        activeOpacity={0.8}
      >
        <Text style={styles.upgradeButtonText}>
          {t('search.unlockPremium')}
        </Text>
      </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    minHeight: 220,
    marginTop: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  chartBackground: {
    opacity: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  lockIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  upgradeButton: {
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 14,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
