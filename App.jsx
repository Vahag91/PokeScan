import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './app/screens/HomeScreen';
import SetDetailScreen from './app/screens/SetDetail';
import SingleCardScreen from './app/screens/SingleCardScreen';
import SearchScreen from './app/screens/SearchScreen';
import CollectionsScreen from './app/screens/CollectionsScreen';
import CollectionDetailScreen from './app/screens/CollectionDetailScreen';
import { getTabIcon, Dummy } from './app/utils';
import ScannerScreen from './app/components/scanner/Scanner';
import { initDatabase } from './app/lib/initDB';
import { MenuProvider } from 'react-native-popup-menu';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HeaderLeft({ onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.headerLeft}>
      <Ionicons name="menu" size={24} color="#1a1a1a" />
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

function Tabs({ setIsDrawerOpen }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: styles.headerStyle,
        headerTintColor: '#1a1a1a',
        headerTitleAlign: 'center',
        tabBarActiveTintColor: '#D21312',
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({ color, size }) => getTabIcon(route.name, color, size),
        headerLeft: () => <HeaderLeft onPress={() => setIsDrawerOpen(true)} />,
        headerRight: () => <HeaderRight />,
      })}
    >
      <Tab.Screen name="Collections" component={CollectionsScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen
        name="Scan"
        component={ScannerScreen}
        options={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tab.Screen name="Sets" component={HomeScreen} />
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
    <NavigationContainer>
      <MenuProvider>
        <View style={styles.flex}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs">
              {() => <Tabs setIsDrawerOpen={setIsDrawerOpen} />}
            </Stack.Screen>
            <Stack.Screen
              name="SetDetail"
              component={SetDetailScreen}
              options={{ headerShown: true, title: 'Card Set' }}
            />
            <Stack.Screen
              name="SingleCardScreen"
              component={SingleCardScreen}
              options={{ headerShown: true, title: 'Card Details' }}
            />
            <Stack.Screen
              name="CollectionDetail"
              component={CollectionDetailScreen}
              options={{ headerShown: true, title: 'Card Details' }}
            />
          </Stack.Navigator>

          <Modal transparent visible={isDrawerOpen} animationType="slide">
            <Pressable
              style={styles.overlay}
              onPress={() => setIsDrawerOpen(false)}
            />
            <View style={styles.drawer}>
              <Text style={styles.section}>Settings</Text>
              {[
                ['diamond-outline', 'Try premium'],
                ['mail-outline', 'Support'],
                ['star-outline', 'Rate us'],
                ['help-circle-outline', 'Help Center'],
              ].map(([icon, label]) => (
                <TouchableOpacity key={label} style={styles.drawerItem}>
                  <Ionicons
                    name={icon}
                    size={20}
                    color="#1a1a1a"
                    style={styles.drawerIcon}
                  />
                  <Text style={styles.drawerLabel}>{label}</Text>
                </TouchableOpacity>
              ))}

              <Text style={styles.section}>Legal</Text>
              {[
                ['document-text-outline', 'Terms of use'],
                ['document-lock-outline', 'Privacy'],
              ].map(([icon, label]) => (
                <TouchableOpacity key={label} style={styles.drawerItem}>
                  <Ionicons
                    name={icon}
                    size={20}
                    color="#1a1a1a"
                    style={styles.drawerIcon}
                  />
                  <Text style={styles.drawerLabel}>{label}</Text>
                </TouchableOpacity>
              ))}

              <Text style={styles.version}>1.20</Text>
            </View>
          </Modal>
        </View>
      </MenuProvider>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  headerStyle: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
    backgroundColor: '#000',
    opacity: 0.2,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 280,
    backgroundColor: '#F9F9F9',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  section: {
    color: '#1A1A1A',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 20,
    marginBottom: 10,
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
    color: '#1A1A1A',
    fontSize: 15,
  },
  version: {
    color: '#999',
    position: 'absolute',
    bottom: 30,
    left: 20,
  },
});
