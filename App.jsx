import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SetDetailScreen from './app/screens/SetDetail';
import SingleCardScreen from './app/screens/SingleCardScreen';
import SearchScreen from './app/screens/SearchScreen';
import CollectionDetailScreen from './app/screens/CollectionDetailScreen';
import { initDatabase } from './app/lib/initDB';
import { MenuProvider } from 'react-native-popup-menu';
import { ThemeProvider, ThemeContext } from './app/context/ThemeContext';
import MainTabs from './app/components/navigation/MainTabs';
import ErrorBoundary from './app/components/ErrorBoundary';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NewOnboarding from './app/screens/NewOnboarding';
import DrawerModal from './app/components/navigation/DrawerModal';
import { SubscriptionProvider } from './app/context/SubscriptionContext';
import { updateDefaultCardPrices } from './supabase/utils';
import PaywallModal from './app/screens/PaywallScreen';
import OneTimeOfferPaywall from './app/components/OneTimeOfferPaywallModal';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [firstLaunch, setFirstLaunch] = useState(null);
  const [showStandardPaywall, setShowStandardPaywall] = useState(false);
  const [showOneTimeOffer, setShowOneTimeOffer] = useState(false);


  useEffect(() => {
    let isMounted = true;
    const initializeApp = async () => {
      try {
        await initDatabase();
        const value = await AsyncStorage.getItem('hasLaunched');
        if (!isMounted) return;

        if (value === null) {
          await AsyncStorage.setItem('hasLaunched', 'true');
          if (isMounted) setFirstLaunch(true);
        } else {
          if (isMounted) setFirstLaunch(false);
        }
      } catch (e) {
        if (isMounted) setFirstLaunch(false);
      }
    };
    initializeApp();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const runUpdates = async () => {
      try {
        const res = await fetch('https://www.google.com/generate_204');
        if (res.status === 204) {
          await updateDefaultCardPrices();
        }
      } catch (e) {
        // Fail silently if offline
      }
    };
    runUpdates();
  }, []);

  const handleOnboardingDone = async () => {
    setFirstLaunch(false);
    const isPremiumUser = await AsyncStorage.getItem('@isPremium');    
    if (isPremiumUser === 'true') return;
    const seenPaywall = await AsyncStorage.getItem('@seenPaywall');
    const seenOTO = await AsyncStorage.getItem('@seenOTO');

    if (!seenPaywall) {
      setShowStandardPaywall(true);
    } else if (!seenOTO) {
      setShowOneTimeOffer(true);
    }
  };

  if (firstLaunch === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (firstLaunch) {
    return (
      <ThemeProvider>
        <NewOnboarding onDone={handleOnboardingDone} />
      </ThemeProvider>
    );
  }

  return (
    <ErrorBoundary>
      <SubscriptionProvider>
        <ThemeProvider>
          <ThemeContext.Consumer>
            {({ theme }) => {
              const navTheme = theme.dark
                ? {
                    ...DarkTheme,
                    colors: {
                      ...DarkTheme.colors,
                      background: theme.background,
                      card: theme.card,
                      text: theme.text,
                    },
                  }
                : {
                    ...DefaultTheme,
                    colors: {
                      ...DefaultTheme.colors,
                      background: theme.background,
                      card: theme.card,
                      text: theme.text,
                    },
                  };

              return (
                <NavigationContainer theme={navTheme}>
                  <MenuProvider>
                    <View style={styles.flex}>
                      <Stack.Navigator
                        screenOptions={({ route }) => ({
                          headerStyle: { backgroundColor: theme.background },
                          headerTintColor: theme.text,
                          headerTitleStyle: { color: theme.text },
                          headerTitleAlign: 'center',
                          headerBackTitleVisible: false,
                          headerShadowVisible: false,
                          contentStyle: { backgroundColor: theme.background },
                        })}
                      >
                        <Stack.Screen
                          name="MainTabs"
                          options={{ headerShown: false }}
                        >
                          {() => <MainTabs setIsDrawerOpen={setIsDrawerOpen} />}
                        </Stack.Screen>
                        <Stack.Screen
                          name="SetDetail"
                          component={SetDetailScreen}
                          options={{ title: 'Set Cards' }}
                        />
                        <Stack.Screen
                          name="SingleCardScreen"
                          component={SingleCardScreen}
                          options={{ title: 'Card Details' }}
                        />
                        <Stack.Screen
                          name="CollectionDetail"
                          component={CollectionDetailScreen}
                          options={{ title: 'Collection Details' }}
                        />
                        <Stack.Screen
                          name="SearchStandalone"
                          component={SearchScreen}
                          options={{ title: 'Search Cards' }}
                        />
                      </Stack.Navigator>

                      {isDrawerOpen && (
                        <DrawerModal
                          visible
                          onClose={() => setIsDrawerOpen(false)}
                        />
                      )}

                      <PaywallModal
                        visible={showStandardPaywall}
                        onClose={async () => {
                          setShowStandardPaywall(false);
                          await AsyncStorage.setItem('@seenPaywall', 'true');

                          const otoSeen = await AsyncStorage.getItem(
                            '@seenOTO',
                          );
                          if (otoSeen !== 'true') {
                            setShowOneTimeOffer(true);
                          }
                        }}
                      />

                      <OneTimeOfferPaywall
                        visible={showOneTimeOffer}
                        onClose={async () => {
                          setShowOneTimeOffer(false);
                          await AsyncStorage.setItem('@seenOTO', 'true');
                        }}
                      />
                    </View>
                  </MenuProvider>
                </NavigationContainer>
              );
            }}
          </ThemeContext.Consumer>
        </ThemeProvider>
      </SubscriptionProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.2,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 280,
    paddingTop: 60,
    paddingHorizontal: 20,
    borderRightWidth: 1,
  },
  section: {
    fontSize: 16,
    marginTop: 20,
    marginBottom: 10,
    fontWeight: '700',
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  drawerIcon: {
    marginRight: 12,
  },
  drawerLabel: {
    fontSize: 15,
  },
  version: {
    position: 'absolute',
    bottom: 30,
    left: 20,
  },
  themeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
});
