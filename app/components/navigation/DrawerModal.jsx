import React, { useContext, useState } from 'react';
import {
  Modal,
  View,
  Pressable,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ThemeContext } from '../../context/ThemeContext';
import { SubscriptionContext } from '../../context/SubscriptionContext';
import { globalStyles } from '../../../globalStyles';
import PaywallModal from '../../screens/PaywallScreen';

export default function DrawerModal({ visible, onClose }) {
  const { theme, themeName, toggleTheme } = useContext(ThemeContext);
  const { isPremium, restorePurchases } = useContext(SubscriptionContext);
  const isLight = themeName !== 'dark';
  const [showPaywall, setShowPaywall] = useState(false);

  const legalItems = [
    ['document-text-outline', 'Terms of use', 'https://www.tortnisoft.com/terms'],
    ['document-lock-outline', 'Privacy', 'https://www.tortnisoft.com/privacy'],
    ['mail-outline', 'Support', 'https://www.tortnisoft.com/contact'],
  ];

  const handleRateUs = () => {
    Linking.openURL('itms-apps://itunes.apple.com/app/id6478329242?action=write-review');
  };

  const handleRestore = async () => {
    try {
      const info = await restorePurchases();
      if (info?.entitlements?.active?.Premium) {
        Alert.alert('Restored', 'Your subscription has been restored.');
      } else {
        Alert.alert('Not Found', 'No active purchases to restore.');
      }
    } catch {
      Alert.alert('Error', 'Failed to restore purchases.');
    }
  };

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
              name={isLight ? 'sunny-outline' : 'moon-outline'}
              size={20}
              color={theme.text}
              style={styles.drawerIcon}
            />
            <Text style={[styles.drawerLabel, globalStyles.text, { color: theme.text }]}>Dark Mode</Text>
          </View>
          <Switch onValueChange={toggleTheme} value={!isLight} />
        </View>

        <Text style={[styles.section, globalStyles.text, { color: theme.text }]}>Settings</Text>

        {!isPremium && (
          <>
            <TouchableOpacity onPress={() => setShowPaywall(true)} style={styles.drawerItem}>
              <Ionicons name="diamond-outline" size={20} color={theme.text} style={styles.drawerIcon} />
              <Text style={[styles.drawerLabel, { color: theme.text }]}>Try Premium</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleRestore} style={styles.drawerItem}>
              <Ionicons name="refresh-circle-outline" size={20} color={theme.text} style={styles.drawerIcon} />
              <Text style={[styles.drawerLabel, { color: theme.text }]}>Restore Purchase</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={handleRateUs} style={styles.drawerItem}>
          <Ionicons name="star-outline" size={20} color={theme.text} style={styles.drawerIcon} />
          <Text style={[styles.drawerLabel, { color: theme.text }]}>Rate us</Text>
        </TouchableOpacity>

        <Text style={[styles.section, globalStyles.text, { color: theme.text }]}>Legal</Text>
        {legalItems.map(([icon, label, link]) => (
          <TouchableOpacity key={label} onPress={() => Linking.openURL(link)} style={styles.drawerItem}>
            <Ionicons name={icon} size={20} color={theme.text} style={styles.drawerIcon} />
            <Text style={[styles.drawerLabel, { color: theme.text }]}>{label}</Text>
          </TouchableOpacity>
        ))}

        <Text style={[styles.version, globalStyles.text, { color: theme.mutedText }]}>1.20</Text>
      </View>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
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
