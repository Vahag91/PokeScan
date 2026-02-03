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
  Switch,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../context/ThemeContext';
import { SubscriptionContext } from '../context/SubscriptionContext';

const { width, height } = Dimensions.get('window');

export default function PaywallModal({ visible, onClose, onPurchaseSuccess }) {
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [freeTrialEnabled, setFreeTrialEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [hasInternet, setHasInternet] = useState(true);
  const [loadingPackages, setLoadingPackages] = useState(true);


  const { themeName, theme } = useContext(ThemeContext);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinnerAnimRef = useRef(new Animated.Value(0));
  
  // Create a simple rotation animation

  // Loading state for close button
  const [closeButtonActive, setCloseButtonActive] = useState(false);

  const {
    purchasePackage,
    restorePurchases,
    fetchOfferings,
    availablePackages,
  } = useContext(SubscriptionContext);

  // Update selected plan when free trial toggle changes
  useEffect(() => {
    if (freeTrialEnabled) {
      setSelectedPlan('weekly');
    } else {
      setSelectedPlan('yearly');
    }
  }, [freeTrialEnabled]);

  // Control close button activation with delay
  useEffect(() => {
    let animationRef = null;
    let timerRef = null;

    if (visible) {
      // Create completely fresh Animated.Value instance
      const freshSpinnerAnim = new Animated.Value(0);
      spinnerAnimRef.current = freshSpinnerAnim;
      
      // Create completely new animation instance
      animationRef = Animated.loop(
        Animated.timing(freshSpinnerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      
      // Start the fresh animation
      animationRef.start();

      timerRef = setTimeout(() => {
        setCloseButtonActive(true);
        // Stop and destroy the animation
        if (animationRef) {
          animationRef.stop();
          animationRef = null;
        }
      }, 3500);
    } else {
      setCloseButtonActive(false);
    }
    
    return () => {
      // Cleanup function - ensure everything is destroyed
      if (timerRef) {
        clearTimeout(timerRef);
        timerRef = null;
      }
      if (animationRef) {
        animationRef.stop();
        animationRef = null;
      }
    };
  }, [visible]);



  useEffect(() => {
    if (!visible) return;
    const checkConnection = async () => {
      try {
        await fetch('https://www.google.com/generate_204', { method: 'HEAD' });
        setHasInternet(true);
        setLoadingPackages(true);
        await fetchOfferings();
        setLoadingPackages(false);
      } catch (e) {
        setHasInternet(false);
        Alert.alert(
          t('paywall.alerts.noInternetConnection'),
          t('paywall.alerts.noInternetConnectionMessage'),
          [
            { text: t('paywall.alerts.cancel'), style: 'cancel', onPress: onClose },
            { text: t('paywall.alerts.tryAgain'), onPress: () => checkConnection() },
          ],
        );
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
        // Call success callback if provided
        if (onPurchaseSuccess) {
          onPurchaseSuccess();
        }
        onClose();
      }
    } catch (e) {
      if (e.message && e.message.includes('Purchase was cancelled')) {
        Alert.alert(
          t('paywall.alerts.purchaseCanceled'),
          t('paywall.alerts.purchaseCanceledMessage'),
        );
        return;
      }
      Alert.alert(t('paywall.alerts.purchaseFailed'), t('paywall.alerts.purchaseFailedMessage'));
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      const info = await restorePurchases();
      if (info?.entitlements?.active?.Premium) {
        Alert.alert(
          t('paywall.alerts.restored'),
          t('paywall.alerts.restoredMessage'),
        );
        // Call success callback if provided
        if (onPurchaseSuccess) {
          onPurchaseSuccess();
        }
        onClose();
      } else {
        Alert.alert(
          t('paywall.alerts.noSubscription'),
          t('paywall.alerts.noSubscriptionMessage'),
        );
      }
    } catch (e) {
      Alert.alert(t('paywall.alerts.restoreFailed'), t('paywall.alerts.restoreFailedMessage'));
    }
  };

  const backgroundImage =
    themeName === 'dark'
      ? require('../assets/onboarding/darkpaywall.png')
      : require('../assets/onboarding/lightpaywall.png');

  const plans = {
    weekly: (() => {
      const weekly = availablePackages?.weekly?.product;
      if (!weekly) return null;
      
      const currency = weekly?.currencyCode || '$';
      const weeklyPrice = parseFloat(weekly.price);
      
      // Safety check for valid price
      if (isNaN(weeklyPrice) || weeklyPrice <= 0) return null;
      
      return {
        title: t('paywall.week'),
        price: `${t('paywall.pricing.freeTrialText')} ${currency}${weeklyPrice.toFixed(2)}${t('paywall.pricing.perWeek')}`,
        badge: null,
      };
    })(),

    yearly: (() => {
      const yearly = availablePackages?.yearly?.product;
      const weekly = availablePackages?.weekly?.product;
      if (!yearly || !weekly) return null;
      
      const currency = yearly?.currencyCode || '$';
      const yearlyPrice = parseFloat(yearly.price);
      const weeklyPrice = parseFloat(weekly.price);
      
      // Safety checks for valid prices
      if (isNaN(yearlyPrice) || yearlyPrice <= 0) return null;
      if (isNaN(weeklyPrice) || weeklyPrice <= 0) return null;
      
      const originalPrice = weeklyPrice * 52;
      const discount = Math.round(((originalPrice - yearlyPrice) / originalPrice) * 100);

      return {
        title: t('paywall.year'),
        originalPrice: `${currency}${originalPrice.toFixed(2)}`,
        currentPrice: `${currency}${yearlyPrice.toFixed(2)}${t('paywall.pricing.perYear')}`,
        badge: `${t('paywall.pricing.save')} ${discount}%`,
      };
    })(),
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

  if (!hasInternet) return null;

  if (loadingPackages) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>


      <ImageBackground source={backgroundImage} style={styles.background}>
        <View
          style={[
            styles.overlay,
            {
              backgroundColor: themeName === 'dark' ? '#0f0f0fcc' : '#ffffffdd',
            },
          ]}
        >
          {/* Close button with simple spinner overlay */}
          <View style={styles.closeBtn}>
            {closeButtonActive ? (
              <TouchableOpacity 
                onPress={onClose} 
                style={styles.closeButtonActive}
              >
                <Ionicons name="close" size={22} color={theme.text} />
              </TouchableOpacity>
            ) : (
              <View style={styles.spinnerOverlay}>
                <Animated.View 
                  key={`spinner-${visible ? 'active' : 'inactive'}`}
                  style={[
                    styles.simpleSpinner,
                    {
                      transform: [{
                        rotate: spinnerAnimRef.current.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg']
                        })
                      }]
                    }
                  ]} 
                />
              </View>
            )}
          </View>

          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
          >
                          <Text style={[styles.title, { color: theme.text }]}>
                {t('paywall.title')}
              </Text>
              <Text style={[styles.subtitle, { color: theme.text }]}>
                {t('paywall.unlockFeatures')}
              </Text>

            <View style={styles.stars}>
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Ionicons key={i} name="star" size={34} color="#fbbf24" />
                ))}
            </View>

            <View style={styles.features}>
                              <Feature
                  icon="scan-outline"
                  text={t('paywall.features.unlimitedScans')}
                  theme={theme}
                />
                <Feature
                  icon="filter-outline"
                  text={t('paywall.features.advancedFilters')}
                  theme={theme}
                />
                <Feature
                  icon="albums-outline"
                  text={t('paywall.features.unlimitedCollections')}
                  theme={theme}
                />
                <Feature
                  icon="cash-outline"
                  text={t('paywall.features.liveMarketPrices')}
                  theme={theme}
                />
            </View>

            <View style={styles.plans}>
              {Object.entries(plans).map(([key, plan]) => {
                if (!plan) return null;
                
                // Additional safety check for plan data
                if (!plan.title) return null;
                if (key === 'yearly' ? (!plan.originalPrice || !plan.currentPrice) : !plan.price) return null;
                
                const isSelected = selectedPlan === key;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => {
                      setSelectedPlan(key);
                      // Update toggle to match the selected plan
                      setFreeTrialEnabled(key === 'weekly');
                    }}
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
                      <View style={[
                        styles.radioButton,
                        { borderColor: isSelected ? '#10B981' : theme.text }
                      ]}>
                        {isSelected && <View style={styles.radioButtonInner} />}
                      </View>
                      <View style={styles.planContent}>
                        <Text style={[styles.planTitle, { color: theme.text }]}>
                          {plan.title}
                        </Text>
                        {key === 'yearly' ? (
                          <View style={styles.yearPriceContainer}>
                            <Text style={[styles.yearOriginalPrice, { color: theme.text }]}>
                              {plan.originalPrice}
                            </Text>
                            <Text style={[styles.yearCurrentPrice, { color: theme.text }]}>
                              {plan.currentPrice}
                            </Text>
                          </View>
                        ) : (
                          <Text style={[styles.planPrice, { color: theme.text }]}>{plan.price}</Text>
                        )}
                      </View>
                    </View>
                    {plan.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{plan.badge}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Free Trial Toggle */}
            <View style={styles.freeTrialToggle}>
                              <Text style={[styles.freeTrialText, { color: theme.text }]}>{t('paywall.freeTrialEnabled')}</Text>
              <Switch
                value={freeTrialEnabled}
                onValueChange={setFreeTrialEnabled}
                trackColor={{ false: '#e2e8f0', true: '#10B981' }}
                thumbColor="#fff"
                ios_backgroundColor="#e2e8f0"
              />
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
                                          {selectedPlan === 'weekly'
                        ? t('paywall.tryForFree')
                        : t('paywall.continue')}
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Show different text based on selected plan */}
            {freeTrialEnabled ? (
              <View style={styles.noPaymentSection}>
                <Ionicons name="checkmark" size={16} color={theme.text} />
                                  <Text style={[styles.noPaymentText, { color: theme.text }]}>{t('paywall.noPaymentDue')}</Text>
              </View>
            ) : (
              <View style={styles.bestValueSection}>
                <Ionicons name="star" size={16} color="#FCD34D" />
                                  <Text style={[styles.bestValueText, { color: theme.text }]}>{t('paywall.bestValue')}</Text>
              </View>
            )}

            <View style={styles.footerLinks}>
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL('https://www.tortnisoft.com/terms')
                }
              >
                <Text style={styles.footerText}>{t('paywall.footer.termsOfUse')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL('https://www.tortnisoft.com/privacy')
                }
              >
                <Text style={styles.footerText}>{t('paywall.footer.privacyPolicy')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRestore}>
                <Text style={styles.footerText}>{t('paywall.footer.restore')}</Text>
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

const styles = StyleSheet.create({
  background: { flex: 1, width, height },
  overlay: { flex: 1, justifyContent: 'center' },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000aa',
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonActive: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    transition: 'all 0.3s ease',
  },
  spinnerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  simpleSpinner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRightColor: '#fff',
  },
  container: {
    paddingTop: 100,
    paddingBottom: 50,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: { fontSize: 24, marginBottom: 6, fontFamily: 'Lato-Bold' },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Lato-Regular',
  },
  stars: { flexDirection: 'row', marginBottom: 24 },
  features: { width: '60%', marginBottom: 30, alignSelf: 'center' },
  feature: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  featureIcon: { marginRight: 10, width: 24 },
  featureText: { fontSize: 18, fontFamily: 'Lato-Bold' },
  plans: { width: '100%' },
  planCard: {
    borderWidth: 1.5,
    borderRadius: 46,
    padding: 12,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 5,
    elevation: 4,
  },
  planHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 0 },
  planTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4, fontFamily: 'Lato-Bold' },
  planPrice: { fontSize: 15, fontWeight: '600', marginTop: 0, fontFamily: 'Lato-Bold' },
  planSub: { fontSize: 14 },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FACC15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#111827' },
  continueBtnWrapper: { marginTop: 18, alignItems: 'center', width: '100%' },
  continueBtn: {
    backgroundColor: '#10B981',
    borderRadius: 28,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    elevation: 2,
  },
  continueText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  footerLinks: {
    marginTop: 20,
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
  freeTrialToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 10,
    width: '100%',
  },
  freeTrialText: {
    fontSize: 14,
    fontFamily: 'Lato-Regular',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
    marginLeft: 8,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  planContent: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  noPaymentSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 10,
    width: '100%',
  },
  noPaymentText: {
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    marginLeft: 5,
  },
  bestValueSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 10,
    width: '100%',
  },
  bestValueText: {
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    marginLeft: 5,
  },
  yearPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
    justifyContent: 'flex-start',
  },
  yearOriginalPrice: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Lato-Bold',
    textDecorationLine: 'line-through',
    marginRight: 8,
    opacity: 0.7,
  },
  yearCurrentPrice: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Lato-Bold',
  },
});
