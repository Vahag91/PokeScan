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
    oneTime: null,
  });

  const STORAGE_KEY = '@isPremium';
  const ENTITLEMENT_ID = 'Premium';

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

        const cachedPremium = await AsyncStorage.getItem(STORAGE_KEY);
        if (cachedPremium !== null) {
          setIsPremium(JSON.parse(cachedPremium));
        }

        await Purchases.configure({ apiKey });

        const info = await Purchases.getCustomerInfo();
        await handleCustomerInfo(info);
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

  const logOutRevenueCat = async () => {
    try {
      await Purchases.logOut();
      await AsyncStorage.removeItem(STORAGE_KEY);
      setIsPremium(false);
      setCustomerInfo(null);
    } catch (e) {
      console.warn('❌ Logout error:', e.message);
    }
  };

  const forceRefresh = async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      await handleCustomerInfo(info);
    } catch (e) {
      console.warn('❌ Force refresh failed:', e.message);
    }
  };

const fetchOfferings = async () => {
  try {
    const offerings = await Purchases.getOfferings();
    if (!offerings?.all) return; 
    const all = {};
    const defaultPkgs = offerings.all.default?.availablePackages || [];
    for (let pkg of defaultPkgs) {
      if (pkg.identifier === '$rc_weekly') all.weekly = pkg;
      if (pkg.identifier === '$rc_annual') all.yearly = pkg;
    }
    const otoPkgs = offerings.all.oto?.availablePackages || [];
    for (let pkg of otoPkgs) {
      if (pkg.identifier === '$rc_annual') all.oneTime = pkg;
    }
    setAvailablePackages(all);
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
        logOutRevenueCat,
        forceRefresh,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};
