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
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';

export default function DrawerModal({ visible, onClose }) {
  // General translations (e.g., alerts.*)
  const { t } = useTranslation();
  // Navigation-specific translations using keyPrefix
  const { t: tNav } = useTranslation(undefined, { keyPrefix: 'navigation' });

  const { theme, themeName, toggleTheme } = useContext(ThemeContext);
  const { isPremium, restorePurchases } = useContext(SubscriptionContext);
  const isLight = themeName !== 'dark';
  const [showPaywall, setShowPaywall] = useState(false);

  const handleRateUs = async () => {
    try {
      // iOS: Try deep link first, then web fallback
      try {
        await Linking.openURL('itms-apps://itunes.apple.com/app/id6749329103?action=write-review');
      } catch {
        await Linking.openURL('https://apps.apple.com/app/id6749329103?action=write-review');
      }
    } catch {
      // ignore
    }
  };

  const handleRestore = async () => {
    try {
      const info = await restorePurchases();
      if (info?.entitlements?.active?.Premium) {
        Alert.alert(t('alerts.restored'), t('alerts.restoredMessage'));
      } else {
        Alert.alert(t('alerts.notFound'), t('alerts.notFoundMessage'));
      }
    } catch {
      Alert.alert(t('alerts.restoreError'), t('alerts.restoreErrorMessage'));
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
        {/* Theme */}
        <Text style={[styles.section, globalStyles.text, { color: theme.text }]}>
          {tNav('theme')}
        </Text>
        <View style={styles.themeToggleRow}>
          <View className="row" style={styles.drawerItem}>
            <Ionicons
              name={isLight ? 'sunny-outline' : 'moon-outline'}
              size={20}
              color={theme.text}
              style={styles.drawerIcon}
            />
            <Text style={[styles.drawerLabel, globalStyles.text, { color: theme.text }]}>
              {tNav('darkMode')}
            </Text>
          </View>
          <Switch onValueChange={toggleTheme} value={!isLight} />
        </View>

        {/* Settings */}
        <Text style={[styles.section, globalStyles.text, { color: theme.text }]}>
          {tNav('settings')}
        </Text>

        {!isPremium ? (
          <>
            <TouchableOpacity onPress={() => setShowPaywall(true)} style={styles.drawerItem}>
              <Ionicons name="diamond-outline" size={20} color={theme.text} style={styles.drawerIcon} />
              <Text style={[styles.drawerLabel, { color: theme.text }]}>
                {tNav('tryPremium')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleRestore} style={styles.drawerItem}>
              <Ionicons name="refresh-circle-outline" size={20} color={theme.text} style={styles.drawerIcon} />
              <Text style={[styles.drawerLabel, { color: theme.text }]}>
                {tNav('restorePurchase')}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.drawerItem}>
            <Ionicons name="shield-checkmark-outline" size={20} color={theme.text} style={styles.drawerIcon} />
            <Text style={[styles.drawerLabel, { color: theme.text }]}>{tNav('youArePremium')}</Text>
          </View>
        )}

        <TouchableOpacity onPress={handleRateUs} style={styles.drawerItem}>
          <Ionicons name="star-outline" size={20} color={theme.text} style={styles.drawerIcon} />
          <Text style={[styles.drawerLabel, { color: theme.text }]}>{tNav('rateUs')}</Text>
        </TouchableOpacity>

        {/* Legal */}
        <Text style={[styles.section, globalStyles.text, { color: theme.text }]}>{tNav('legal')}</Text>
        {[
          ['document-text-outline', tNav('termsOfUse'), 'https://www.tortnisoft.com/terms'],
          ['document-lock-outline', tNav('privacy'), 'https://www.tortnisoft.com/privacy'],
          ['mail-outline', tNav('support'), 'https://www.tortnisoft.com/contact'],
        ].map(([icon, label, link]) => (
          <TouchableOpacity key={icon} onPress={() => Linking.openURL(link)} style={styles.drawerItem}>
            <Ionicons name={icon} size={20} color={theme.text} style={styles.drawerIcon} />
            <Text style={[styles.drawerLabel, { color: theme.text }]}>{label}</Text>
          </TouchableOpacity>
        ))}

        {/* <Text style={[styles.version, globalStyles.text, { color: theme.mutedText }]}>
          {tNav('version')}
        </Text> */}

      </View>

      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
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
