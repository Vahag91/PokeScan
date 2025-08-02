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
import NetInfo from '@react-native-community/netinfo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ThemeContext } from '../context/ThemeContext';
import { SubscriptionContext } from '../context/SubscriptionContext';

const { width } = Dimensions.get('window');

export default function PaywallModal({ visible, onClose }) {
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [loading, setLoading] = useState(false);
  const [hasInternet, setHasInternet] = useState(true);

  const { themeName, theme } = useContext(ThemeContext);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const {
    purchasePackage,
    restorePurchases,
    fetchOfferings,
    availablePackages,
  } = useContext(SubscriptionContext);

  // Check internet connection on modal open
  useEffect(() => {
    if (!visible) return;

    const checkConnection = async () => {
      const state = await NetInfo.fetch();
      if (!state.isConnected) {
        setHasInternet(false);
        Alert.alert(
          'No Internet Connection',
          'Please check your connection and try again.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: onClose,
            },
            {
              text: 'Try Again',
              onPress: () => checkConnection(),
            },
          ]
        );
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

  const handlePurchase = async () => {
    const selectedPkg = availablePackages[selectedPlan];
    if (!selectedPkg) return;
    setLoading(true);
    try {
      const result = await purchasePackage(selectedPkg);
      if (result?.customerInfo?.entitlements?.active?.Premium) {
        onClose();
      }
    } catch (e) {
      if (!e.userCancelled) console.warn('❌ Purchase failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      const info = await restorePurchases();
      if (info?.entitlements?.active?.Premium) {
        onClose();
      }
    } catch (e) {
      console.warn('❌ Restore failed:', e);
    }
  };

  const backgroundImage =
    themeName === 'dark'
      ? require('../assets/onboarding/darkpaywall.png')
      : require('../assets/onboarding/lightpaywall.png');

  const plans = {
    yearly: {
      title: 'Yearly Access',
      price: availablePackages.yearly?.product.priceString || '',
      sub: availablePackages.yearly?.product.pricePerWeekString
        ? `${availablePackages.yearly.product.pricePerWeekString} per week`
        : '',
      badge: 'SAVE 85%',
    },
    weekly: {
      title: 'Weekly Access',
      price: availablePackages.weekly?.product.priceString || '',
      sub:
        availablePackages.weekly?.product.introPrice?.price === 0
          ? '3 days free trial'
          : '',
    },
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
      ])
    ).start();
  }, [pulseAnim]);

  if (!hasInternet) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <Ionicons name="close" size={26} color={theme.text} />
      </TouchableOpacity>

      <ImageBackground source={backgroundImage} style={styles.background}>
        <View
          style={[
            styles.overlay,
            {
              backgroundColor: themeName === 'dark' ? '#0f0f0fcc' : '#ffffffdd',
            },
          ]}
        >
          <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            <Text style={[styles.title, { color: theme.text }]}>
              Upgrade to Premium
            </Text>
            <Text style={[styles.subtitle, { color: theme.text }]}>
              Unlock all features and scan with full power.
            </Text>

            <View style={styles.stars}>
              {Array(5).fill(0).map((_, i) => (
                <Ionicons key={i} name="star" size={34} color="#fbbf24" />
              ))}
            </View>

            <View style={styles.features}>
              <Feature icon="scan-outline" text="Unlimited Card Scans" theme={theme} />
              <Feature icon="filter-outline" text="Advanced Search Filters" theme={theme} />
              <Feature icon="albums-outline" text="Unlimited Collections" theme={theme} />
              <Feature icon="cash-outline" text="Live Market Prices" theme={theme} />
            </View>

            <View style={styles.plans}>
              {Object.entries(plans).map(([key, plan]) => {
                const isSelected = selectedPlan === key;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setSelectedPlan(key)}
                    style={[
                      styles.planCard,
                      {
                        borderColor: isSelected ? '#10B981' : '#e2e8f0',
                        backgroundColor: theme.card,
                        transform: [{ scale: isSelected ? 1.02 : 1 }],
                        shadowOpacity: isSelected ? 0.2 : 0.05,
                      },
                    ]}
                    activeOpacity={0.9}
                  >
                    <View style={styles.planHeader}>
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                        size={22}
                        color={isSelected ? '#10B981' : theme.text}
                      />
                      <Text style={[styles.planTitle, { color: theme.text }]}>
                        {plan.title}
                      </Text>
                    </View>
                    <Text style={[styles.planPrice, { color: theme.text }]}>
                      {plan.sub}
                    </Text>
                    <Text style={styles.planSub}>{plan.price}</Text>
                    {plan.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{plan.badge}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Animated.View
              style={[
                styles.continueBtnWrapper,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <TouchableOpacity
                style={styles.continueBtn}
                activeOpacity={0.8}
                onPress={handlePurchase}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.continueText}>
                    {selectedPlan === 'weekly' ? 'Start Free Trial' : 'Continue'}
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.footerLinks}>
              <TouchableOpacity onPress={() => Linking.openURL('https://yourdomain.com/terms')}>
                <Text style={styles.footerText}>Terms of Use</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://yourdomain.com/privacy')}>
                <Text style={styles.footerText}>Privacy Policy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRestore}>
                <Text style={styles.footerText}>Restore</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </ImageBackground>
    </Modal>
  );
}

function Feature({ icon, text, theme }) {
  return (
    <View style={styles.feature}>
      <Ionicons name={icon} size={20} color="#10B981" style={styles.featureIcon} />
      <Text style={[styles.featureText, { color: theme.text }]}>{text}</Text>
    </View>
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
  },
  closeBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: '#00000033',
    padding: 8,
    borderRadius: 20,
  },
  container: {
    paddingTop: 100,
    paddingBottom: 50,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 6,
    fontFamily: 'Lato-BoldItalic',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Lato-Regular',
  },
  stars: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  features: {
    width: '60%',
    marginBottom: 30,
    alignSelf: 'center',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  featureIcon: {
    marginRight: 10,
    width: 24,
  },
  featureText: {
    fontSize: 18,
    fontFamily: 'Lato-Bold',
  },
  plans: {
    width: '100%',
  },
  planCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 5,
    elevation: 4,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  planPrice: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  planSub: {
    color: '#94A3B8',
    fontSize: 13,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FACC15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#111827',
  },
  continueBtnWrapper: {
    marginTop: 18,
    alignItems: 'center',
    width: '100%',
  },
  continueBtn: {
    backgroundColor: '#10B981',
    borderRadius: 28,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    elevation: 2,
  },
  continueText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  footerLinks: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 13,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
