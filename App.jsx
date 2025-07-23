// Updated `App.js` with global font styles and theme-aware text
import React, { useState, useEffect, useMemo, useContext } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Switch,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SetScreen from './app/screens/SetScreen';
import SetDetailScreen from './app/screens/SetDetail';
import SingleCardScreen from './app/screens/SingleCardScreen';
import SearchScreen from './app/screens/SearchScreen';
import CollectionsScreen from './app/screens/CollectionsScreen';
import CollectionDetailScreen from './app/screens/CollectionDetailScreen';
import { getTabIcon, Dummy } from './app/utils';
import ScannerScreen from './app/components/scanner/Scanner';
import { initDatabase } from './app/lib/initDB';
import { MenuProvider } from 'react-native-popup-menu';
import { ThemeProvider, ThemeContext } from './app/context/ThemeContext';
import { globalStyles } from './globalStyles';
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function DrawerModal({ visible, onClose }) {
  const { theme, themeName, toggleTheme } = useContext(ThemeContext);
  const choosenTheme = themeName === 'dark' ? false : true;

  const drawerItems = [
    ['diamond-outline', 'Try premium'],
    ['mail-outline', 'Support'],
    ['star-outline', 'Rate us'],
    ['help-circle-outline', 'Help Center'],
  ];

  const legalItems = [
    ['document-text-outline', 'Terms of use'],
    ['document-lock-outline', 'Privacy'],
  ];

  return (
    <Modal transparent visible={visible} animationType="slide">
      <Pressable
        style={[styles.overlay, { backgroundColor: theme.text, opacity: 0.2 }]}
        onPress={onClose}
      />
      <View
        style={[
          styles.drawer,
          { backgroundColor: theme.background, borderRightColor: theme.border },
        ]}
      >
        <Text style={[styles.section, globalStyles.text, { color: theme.text }]}>Theme</Text>
        <View style={styles.themeToggleRow}>
          <View style={styles.drawerItem}>
            <Ionicons
              name={choosenTheme ? 'sunny-outline' : 'moon-outline'}
              size={20}
              color={theme.text}
              style={styles.drawerIcon}
            />
            <Text style={[styles.drawerLabel, globalStyles.text, { color: theme.text }]}>Dark Mode</Text>
          </View>
          <Switch onValueChange={toggleTheme} value={!choosenTheme} />
        </View>

        <Text style={[styles.section, globalStyles.text, { color: theme.text }]}>Settings</Text>
        {drawerItems.map(([icon, label]) => (
          <TouchableOpacity key={label} style={styles.drawerItem}>
            <Ionicons
              name={icon}
              size={20}
              color={theme.text}
              style={styles.drawerIcon}
            />
            <Text style={[styles.drawerLabel, globalStyles.text, { color: theme.text }]}>{label}</Text>
          </TouchableOpacity>
        ))}

        <Text style={[styles.section, globalStyles.text, { color: theme.text }]}>Legal</Text>
        {legalItems.map(([icon, label]) => (
          <TouchableOpacity key={label} style={styles.drawerItem}>
            <Ionicons
              name={icon}
              size={20}
              color={theme.text}
              style={styles.drawerIcon}
            />
            <Text style={[styles.drawerLabel, globalStyles.text, { color: theme.text }]}>{label}</Text>
          </TouchableOpacity>
        ))}

        <Text style={[styles.version, globalStyles.text, { color: theme.mutedText }]}>1.20</Text>
      </View>
    </Modal>
  );
}

function HeaderLeft({ onPress, iconColor }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.headerLeft}>
      <Ionicons name="menu" size={24} color={iconColor} />
    </TouchableOpacity>
  );
}

function HeaderRight() {
  return (
    <View style={styles.headerRight}>
      <Ionicons name="crown-outline" size={18} color="#fff" />
    </View>
  );
}

function MainTabs({ setIsDrawerOpen }) {
  const { theme } = useContext(ThemeContext);

  const screenOptions = useMemo(
    () => ({
      headerShown: true,
      headerStyle: { backgroundColor: theme.background },
      headerTintColor: theme.text,
      headerTitleAlign: 'center',
      tabBarActiveTintColor: '#D21312',
      tabBarStyle: {
        backgroundColor: theme.card,
        borderTopColor: theme.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 5,
      },
      headerLeft: () => (
        <HeaderLeft
          onPress={() => setIsDrawerOpen(true)}
          iconColor={theme.text}
        />
      ),
      headerRight: () => <HeaderRight />,
    }),
    [theme],
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...screenOptions,
        tabBarIcon: ({ color, size }) => getTabIcon(route.name, color, size),
      })}
    >
      <Tab.Screen name="Collections" component={CollectionsScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen
        name="Scan"
        component={ScannerScreen}
        options={{ headerShown: false, tabBarStyle: { display: 'none' } }}
      />
      <Tab.Screen name="Sets" component={SetScreen} />
      <Tab.Screen name="History" component={Dummy} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    initDatabase();
  }, []);

  return (
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
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  headerLeft: {
    paddingHorizontal: 16,
  },
  headerRight: {
    marginRight: 16,
    backgroundColor: '#FF6B6B',
    padding: 8,
    borderRadius: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
