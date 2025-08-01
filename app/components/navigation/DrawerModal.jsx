import React, { useContext } from 'react';
import {
  Modal,
  View,
  Pressable,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ThemeContext } from '../../context/ThemeContext';
import { globalStyles } from '../../../globalStyles';

export default function DrawerModal({ visible, onClose }) {
  const { theme, themeName, toggleTheme } = useContext(ThemeContext);
  const isLight = themeName !== 'dark';

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
        <Text style={[styles.section, globalStyles.text, { color: theme.text }]}>
          Theme
        </Text>
        <View style={styles.themeToggleRow}>
          <View style={styles.drawerItem}>
            <Ionicons
              name={isLight ? 'sunny-outline' : 'moon-outline'}
              size={20}
              color={theme.text}
              style={styles.drawerIcon}
            />
            <Text
              style={[styles.drawerLabel, globalStyles.text, { color: theme.text }]}
            >
              Dark Mode
            </Text>
          </View>
          <Switch onValueChange={toggleTheme} value={!isLight} />
        </View>

        <Text style={[styles.section, globalStyles.text, { color: theme.text }]}>
          Settings
        </Text>
        {drawerItems.map(([icon, label]) => (
          <TouchableOpacity key={label} style={styles.drawerItem}>
            <Ionicons name={icon} size={20} color={theme.text} style={styles.drawerIcon} />
            <Text style={[styles.drawerLabel, globalStyles.text, { color: theme.text }]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}

        <Text style={[styles.section, globalStyles.text, { color: theme.text }]}>Legal</Text>
        {legalItems.map(([icon, label]) => (
          <TouchableOpacity key={label} style={styles.drawerItem}>
            <Ionicons name={icon} size={20} color={theme.text} style={styles.drawerIcon} />
            <Text style={[styles.drawerLabel, globalStyles.text, { color: theme.text }]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}

        <Text style={[styles.version, globalStyles.text, { color: theme.mutedText }]}>
          1.20
        </Text>
      </View>
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