import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Switch,
  ActivityIndicator,
  Platform
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SetDetailScreen from './app/screens/SetDetail';
import SingleCardScreen from './app/screens/SingleCardScreen';
import CollectionDetailScreen from './app/screens/CollectionDetailScreen';
import { initDatabase } from './app/lib/initDB';
import { MenuProvider } from 'react-native-popup-menu';
import { ThemeProvider, ThemeContext } from './app/context/ThemeContext';
import MainTabs from './app/components/navigation/MainTabs';
import ErrorBoundary from './app/components/ErrorBoundary';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NewOnboarding from './app/screens/NewOnboarding';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import DrawerModal from './app/components/navigation/DrawerModal';
const Stack = createNativeStackNavigator();


export default function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [firstLaunch, setFirstLaunch] = useState(null);

  useEffect(() => {
    initDatabase();
    AsyncStorage.getItem('hasLaunched').then(value => {
      if (value === null) {
        AsyncStorage.setItem('hasLaunched', 'true');
        setFirstLaunch(true);
      } else {
        setFirstLaunch(false);
      }
    });
  }, []);


useEffect(() => {
  Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

  const apiKey =
    Platform.OS === 'ios'
      ? process.env.REVENUE_PUBLIC_IOS
      : process.env.REVENUE_PUBLIC_ANDROID;

  if (apiKey) {
    Purchases.configure({ apiKey });
  } else {
    console.warn('❌ RevenueCat API key is missing for platform:', Platform.OS);
  }

  Purchases.getOfferings()
    .then((offerings) => {
      console.log('📦 Offerings:', offerings);
    })
    .catch((err) => {
      console.warn('❌ Error fetching offerings:', err);
    });
}, []);

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
        <NewOnboarding onDone={() => setFirstLaunch(false)} />
      </ThemeProvider>
    );
  }

  return (
    <ErrorBoundary>
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
                        headerShown: route.name !== 'MainTabs',
                        headerStyle: { backgroundColor: theme.background },
                        headerTintColor: theme.text,
                        headerTitleStyle: { color: theme.text },
                        headerTitleAlign: 'center',
                        headerBackTitleVisible: false,
                        headerShadowVisible: false,
                        contentStyle: { backgroundColor: theme.background },
                      })}
                    >
                      <Stack.Screen name="MainTabs">
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
                        options={{ title: 'Card Details' }}
                      />
                    </Stack.Navigator>

                    <DrawerModal
                      visible={isDrawerOpen}
                      onClose={() => setIsDrawerOpen(false)}
                    />
                  </View>
                </MenuProvider>
              </NavigationContainer>
            );
          }}
        </ThemeContext.Consumer>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
