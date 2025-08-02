import React, { createContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

export const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [availablePackages, setAvailablePackages] = useState({
    yearly: null,
    weekly: null,
  });

  const STORAGE_KEY = '@isPremium';
  const ENTITLEMENT_ID = 'Premium'; // should match RevenueCat

  useEffect(() => {
    const initializeRevenueCat = async () => {
      try {
        Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

        const apiKey =
          Platform.OS === 'ios'
            ? process.env.REVENUE_PUBLIC_IOS
            : process.env.REVENUE_PUBLIC_ANDROID;

        if (!apiKey) {
          console.warn('❌ RevenueCat API Key missing');
          return;
        }

        // Step 1: Load cached premium state immediately
        const cachedPremium = await AsyncStorage.getItem(STORAGE_KEY);
        if (cachedPremium !== null) {
          setIsPremium(JSON.parse(cachedPremium));
        }
        await Purchases.configure({ apiKey });

        // Step 3: Fetch customer info and offerings
        const info = await Purchases.getCustomerInfo();
        handleCustomerInfo(info);
        await fetchOfferings();
      } catch (err) {
        console.warn('❌ RevenueCat init error:', err.message);
      }
    };

    initializeRevenueCat();
  }, []);

  const handleCustomerInfo = async info => {
    const hasPremium = Boolean(info.entitlements.active[ENTITLEMENT_ID]);
    setIsPremium(hasPremium);
    setCustomerInfo(info);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(hasPremium));
  };

  const purchasePackage = async pkg => {
    try {
      const info = await Purchases.purchasePackage(pkg);
      await handleCustomerInfo(info.customerInfo);
      return info;
    } catch (err) {
      console.warn('❌ Purchase error:', err.message);
      throw err;
    }
  };

  const restorePurchases = async () => {
    try {
      const info = await Purchases.restorePurchases();
      await handleCustomerInfo(info);
      return info;
    } catch (err) {
      console.warn('❌ Restore error:', err.message);
      throw err;
    }
  };

  const refreshCustomerInfo = async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      await handleCustomerInfo(info);
    } catch (err) {
      console.warn('❌ Refresh error:', err.message);
    }
  };

  const fetchOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      const current = offerings.current;

      if (current?.availablePackages?.length) {
        const all = {};
        for (let pkg of current.availablePackages) {
          if (pkg.identifier === '$rc_weekly') all.weekly = pkg;
          if (pkg.identifier === '$rc_annual') all.yearly = pkg;
        }
        setAvailablePackages(all);
      }
    } catch (e) {
      console.warn('❌ Failed to fetch packages:', e.message);
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium,
        customerInfo,
        purchasePackage,
        restorePurchases,
        refreshCustomerInfo,
        fetchOfferings,
        availablePackages,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};
