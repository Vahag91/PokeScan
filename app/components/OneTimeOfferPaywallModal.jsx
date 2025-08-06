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
          'No Internet Connection',
          'Please check your network and try again.',
          [
            { text: 'Cancel', style: 'cancel', onPress: onClose },
            { text: 'Retry', onPress: () => checkConnection() },
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
        Alert.alert("Purchase Failed", "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      const info = await restorePurchases();
      if (info?.entitlements?.active?.Premium) {
        Alert.alert("Restored", "Your subscription has been successfully restored.");
        onClose();
      } else {
        Alert.alert("No Subscription", "No active subscription found to restore.");
      }
    } catch (e) {
      Alert.alert("Restore Failed", "Something went wrong during restore.");
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
  const price = plan?.product?.price;
  const currency = plan?.product?.currencyCode;

  if (!hasInternet) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity
        style={[styles.closeBtn, { backgroundColor: theme.overlayDark }]}
        onPress={onClose}
      >
        <Ionicons name="close" size={26} color={theme.text} />
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
                  <Text style={styles.specialOfferBadgeText}>You will never see this again</Text>
                </View>
                <Text style={[styles.offerTitle, { color: theme.text }]}>Exclusive One-Time Offer</Text>
                <View style={styles.offerHighlight}>
                  <Text style={styles.offerHighlightText}>50% OFF</Text>
                </View>
                <Text style={[styles.offerSubtitle, { color: theme.text }]}>This premium upgrade is available only once at this special price. Don't miss this opportunity to unlock all features!</Text>
              </View>

              <View style={styles.featureList}>
                <Feature icon="scan-outline" text="Unlimited Card Scans" theme={theme} />
                <Feature icon="filter-outline" text="Advanced Search Filters" theme={theme} />
                <Feature icon="albums-outline" text="Unlimited Collections" theme={theme} />
                <Feature icon="cash-outline" text="Real-Time Market Pricing" theme={theme} />
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
                      Upgrade Now – {currency} {price} per year
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity onPress={handleRestore}>
                <Text style={styles.restoreText}>Restore Purchase</Text>
              </TouchableOpacity>

              <View style={styles.footerLinks}>
                <TouchableOpacity onPress={() => Linking.openURL('https://www.tortnisoft.com/terms')}>
                  <Text style={styles.footerText}>Terms of Use</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL('https://www.tortnisoft.com/privacy')}>
                  <Text style={styles.footerText}>Privacy Policy</Text>
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
    top: 40,
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