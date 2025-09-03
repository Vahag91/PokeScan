import React, { useState, useContext, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  ScrollView,
  Animated,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../context/ThemeContext';
import { SubscriptionContext } from '../context/SubscriptionContext';

const { width } = Dimensions.get('window');

function Feature({ icon, text, theme }) {
  return (
    <View style={styles.feature}>
      <Ionicons
        name={icon}
        size={20}
        color="#10B981"
        style={styles.featureIcon}
      />
      <Text style={[styles.featureText, { color: theme.text }]}>{text}</Text>
    </View>
  );
}

export default function OneTimeOfferPaywall({ visible, onClose }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [hasInternet, setHasInternet] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { themeName, theme } = useContext(ThemeContext);
  const {
    purchasePackage,
    restorePurchases,
    fetchOfferings,
    availablePackages,
  } = useContext(SubscriptionContext);

  useEffect(() => {
    if (!visible) return;

    const checkConnection = async () => {
      try {
        const res = await fetch('https://www.google.com/generate_204');
        if (res.status === 204) {
          setHasInternet(true);
          fetchOfferings();
        } else {
          throw new Error('No internet');
        }
      } catch (e) {
        setHasInternet(false);
        Alert.alert(
          t('oneTimeOffer.alerts.noInternet'),
          t('oneTimeOffer.alerts.noInternetMessage'),
          [
            { text: t('common.cancel'), style: 'cancel', onPress: onClose },
            { text: t('common.retry'), onPress: () => checkConnection() },
          ]
        );
      }
    };

    checkConnection();
  }, [visible]);

  useEffect(() => {
    const checkIfSubscribed = async () => {
      try {
        const info = await restorePurchases();
        if (info?.entitlements?.active?.Premium) onClose();
      } catch {}
    };
    if (visible && hasInternet) checkIfSubscribed();
  }, [visible, hasInternet]);

  const handlePurchase = async () => {
    const offerPkg = availablePackages.oneTime;
    if (!offerPkg) return;
    setLoading(true);
    try {
      const result = await purchasePackage(offerPkg);
      if (result?.customerInfo?.entitlements?.active?.Premium) onClose();
    } catch (e) {
      if (!e.userCancelled) {
        Alert.alert(t('oneTimeOffer.alerts.purchaseFailed'), t('oneTimeOffer.alerts.purchaseFailedMessage'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      const info = await restorePurchases();
      if (info?.entitlements?.active?.Premium) {
        Alert.alert(t('oneTimeOffer.alerts.restored'), t('oneTimeOffer.alerts.restoredMessage'));
        onClose();
      } else {
        Alert.alert(t('oneTimeOffer.alerts.noSubscription'), t('oneTimeOffer.alerts.noSubscriptionMessage'));
      }
    } catch (e) {
              Alert.alert(t('oneTimeOffer.alerts.restoreFailed'), t('oneTimeOffer.alerts.restoreFailedMessage'));
    }
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  const backgroundImage =
    themeName === 'dark'
      ? require('../assets/onboarding/darkpaywall.png')
      : require('../assets/onboarding/lightpaywall.png');

  const plan = availablePackages.oneTime;
  const price = plan?.product?.price.toFixed(2);
  const currency = plan?.product?.currencyCode;

  if (!hasInternet) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={onClose}
      >
        <Ionicons name="close" size={22} color={theme.text} />
      </TouchableOpacity>

      <ImageBackground source={backgroundImage} style={styles.background}>
        <View
          style={[
            styles.overlay,
            {
              backgroundColor: themeName === 'dark' ? '#0f0f0fe8' : '#ffffffdd',
            },
          ]}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <View style={styles.specialOfferContainer}>
                <View style={styles.specialOfferBadge}>
                  <Text style={styles.specialOfferBadgeText}>{t('oneTimeOffer.specialOfferBadge')}</Text>
                </View>
                                  <Text style={[styles.offerTitle, { color: theme.text }]}>{t('oneTimeOffer.exclusiveOffer')}</Text>
                <View style={styles.offerHighlight}>
                                      <Text style={styles.offerHighlightText}>{t('oneTimeOffer.fiftyPercentOff')}</Text>
                </View>
                                  <Text style={[styles.offerSubtitle, { color: theme.text }]}>{t('oneTimeOffer.offerSubtitle')}</Text>
              </View>

              <View style={styles.featureList}>
                              <Feature icon="scan-outline" text={t('oneTimeOffer.features.unlimitedScans')} theme={theme} />
              <Feature icon="filter-outline" text={t('oneTimeOffer.features.advancedFilters')} theme={theme} />
              <Feature icon="albums-outline" text={t('oneTimeOffer.features.unlimitedCollections')} theme={theme} />
              <Feature icon="cash-outline" text={t('oneTimeOffer.features.realTimePricing')} theme={theme} />
              </View>

              <Animated.View style={[styles.ctaBtnWrapper, { transform: [{ scale: pulseAnim }] }]}>
                <TouchableOpacity
                  style={styles.ctaBtn}
                  activeOpacity={0.9}
                  onPress={handlePurchase}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.ctaText}>
                      {t('lockedOverlay.upgradeNow')} {currency} {price} per year
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity onPress={handleRestore}>
                <Text style={styles.restoreText}>{t('oneTimeOffer.restorePurchase')}</Text>
              </TouchableOpacity>

              <View style={styles.footerLinks}>
                <TouchableOpacity onPress={() => Linking.openURL('https://www.tortnisoft.com/terms')}>
                  <Text style={styles.footerText}>{t('oneTimeOffer.termsOfUse')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL('https://www.tortnisoft.com/privacy')}>
                  <Text style={styles.footerText}>{t('oneTimeOffer.privacyPolicy')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </ImageBackground>
    </Modal>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width, height: '100%' },
  overlay: { flex: 1, justifyContent: 'center' },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  content: { alignItems: 'center' },
  specialOfferContainer: {
    alignItems: 'center',
    marginBottom: 25,
    width: '100%',
  },
  specialOfferBadge: {
    backgroundColor: '#F97316',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
    transform: [{ rotate: '-5deg' }],
  },
  specialOfferBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  offerTitle: {
    fontSize: 28,
    fontFamily: 'Lato-Bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  offerHighlight: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 30,
    marginBottom: 15,
  },
  offerHighlightText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  offerSubtitle: {
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  featureList: {
    width: '80%',
    marginBottom: 30,
    alignSelf: 'center',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  featureIcon: { marginRight: 10, width: 24 },
  featureText: { fontSize: 18, fontFamily: 'Lato-Bold' },
  ctaBtnWrapper: { width: '100%', marginTop: 16, marginBottom: 20 },
  ctaBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    width: '100%',
    elevation: 3,
  },
  ctaText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  restoreText: { color: '#94A3B8', marginTop: 12, fontSize: 13 },
  footerLinks: {
    marginTop: 30,
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 13,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    textDecorationLine: 'underline',
  },
});