import React, { useContext, useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import CollectionsScreen from '../../screens/CollectionsScreen';
import CollectionsScreen from '../../screens/CollectionsScreen';
import SearchScreen from '../../screens/SearchScreen';
import ScannerScreen from '../../components/scanner/Scanner';
import SetScreen from '../../screens/SetScreen';
import HeaderLeft from '../../components/navigation/HeaderLeft';
import HeaderRight from '../../components/navigation/HeaderRight';
import getTabIcon from '../../components/navigation/getTabIcon';
import { ThemeContext } from '../../context/ThemeContext';

const Tab = createBottomTabNavigator();

export default function MainTabs({ setIsDrawerOpen }) {
  const { theme } = useContext(ThemeContext);

  const screenOptions = useMemo(() => ({
    headerShown: true,
    headerStyle: { backgroundColor: theme.background },
    headerTintColor: theme.text,
    headerTitleAlign: 'center',
    tabBarActiveTintColor: '#6366F1',
    tabBarInactiveTintColor: theme.mutedText,
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
      <HeaderLeft onPress={() => setIsDrawerOpen(true)} iconColor={theme.text} />
    ),
    headerRight: () => <HeaderRight />,
  }), [theme]);

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
    </Tab.Navigator>
  );
}