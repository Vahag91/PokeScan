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
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ThemeContext } from '../context/ThemeContext';
import { SubscriptionContext } from '../context/SubscriptionContext';

const { width } = Dimensions.get('window');

export default function OneTimeOfferPaywallModal({ visible, onClose }) {
  const [loading, setLoading] = useState(false);
  const [hasInternet, setHasInternet] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { themeName, theme } = useContext(ThemeContext);
  const { purchasePackage, restorePurchases, fetchOfferings, availablePackages } =
    useContext(SubscriptionContext);

  useEffect(() => {
    if (!visible) return;

    const checkConnection = async () => {
      const state = await NetInfo.fetch();
      if (!state.isConnected) {
        setHasInternet(false);
        Alert.alert('No Internet', 'Please check your connection.', [
          { text: 'OK', onPress: onClose },
        ]);
      } else {
        setHasInternet(true);
        fetchOfferings();
      }
    };

    checkConnection();
  }, [visible]);

  useEffect(() => {
    const checkIfSubscribed = async () => {
      try {
        const info = await restorePurchases();
        if (info?.entitlements?.active?.Premium) {
          onClose();
        }
      } catch {}
    };
    if (visible && hasInternet) checkIfSubscribed();
  }, [visible, hasInternet]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handlePurchase = async () => {
    const discountedPkg = availablePackages.yearly;
    if (!discountedPkg) return;
    setLoading(true);
    try {
      const result = await purchasePackage(discountedPkg);
      if (result?.customerInfo?.entitlements?.active?.Premium) {
        onClose();
      }
    } catch (e) {
      if (!e.userCancelled) console.warn('❌ Purchase failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const backgroundImage =
    themeName === 'dark'
      ? require('../assets/onboarding/darkpaywall.png')
      : require('../assets/onboarding/lightpaywall.png');

  const plan = {
    title: 'Premium Yearly Access',
    price: availablePackages.yearly?.product.priceString || '$49.99',
    sub: 'One-time offer only – cancel anytime',
    perMonth: availablePackages.yearly
      ? `$${(availablePackages.yearly.product.price / 12).toFixed(2)}/month`
      : '$4.16/month',
  };

  const features = [
    'Unlimited access to all features',
    'Ad-free experience',
    'Priority customer support',
    'Exclusive updates & content',
    'Supports ongoing development',
  ];

  if (!hasInternet) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <ImageBackground source={backgroundImage} style={styles.background} blurRadius={2}>
        <View
          style={[
            styles.overlay,
            {
              backgroundColor:
                themeName === 'dark' ? 'rgba(0,0,0,0.88)' : 'rgba(255,255,255,0.95)',
            },
          ]}
        >
          <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>

            <Text style={[styles.title, { color: theme.primary }]}>Unlock Premium</Text>
            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
              Enjoy exclusive benefits and full access
            </Text>

            <View style={styles.badge}>
              <Text style={styles.badgeText}>LIMITED TIME</Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.primary }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{plan.title}</Text>
                <View style={styles.discountTag}>
                  <Text style={styles.discountText}>50% OFF</Text>
                </View>
              </View>
              <Text style={[styles.cardPrice, { color: theme.text }]}>{plan.price}</Text>
              <Text style={[styles.cardSub, { color: theme.secondaryText }]}>{plan.perMonth}</Text>
              <Text style={[styles.cardNote, { color: theme.secondaryText }]}>{plan.sub}</Text>
            </View>

            <View style={styles.features}>
              {features.map((text, idx) => (
                <View key={idx} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                  <Text style={[styles.featureText, { color: theme.text }]}>{text}</Text>
                </View>
              ))}
            </View>

            <Animated.View style={{ transform: [{ scale: pulseAnim }], width: '100%' }}>
              <TouchableOpacity
                style={[styles.ctaBtn, { backgroundColor: theme.primary }]}
                activeOpacity={0.85}
                onPress={handlePurchase}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.ctaText}>Upgrade Now</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity onPress={restorePurchases}>
              <Text style={[styles.restoreText, { color: theme.secondaryText }]}>Restore Purchase</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </ImageBackground>
    </Modal>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width,
    height: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  container: {
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 8,
    zIndex: 99,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Lato-Bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.8,
  },
  badge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 20,
  },
  badgeText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  card: {
    width: '100%',
    borderWidth: 2,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Lato-Bold',
    marginRight: 10,
  },
  discountTag: {
    backgroundColor: '#FACC15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  cardPrice: {
    fontSize: 30,
    fontFamily: 'Lato-Bold',
    marginVertical: 4,
  },
  cardSub: {
    fontSize: 16,
    fontFamily: 'Lato-Regular',
  },
  cardNote: {
    fontSize: 14,
    fontFamily: 'Lato-Italic',
    marginTop: 6,
  },
  features: {
    width: '100%',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    marginLeft: 8,
  },
  ctaBtn: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 16,
  },
  ctaText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Lato-Bold',
  },
  restoreText: {
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    textDecorationLine: 'underline',
  },
});