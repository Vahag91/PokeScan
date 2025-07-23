import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ThemeContext } from '../context/ThemeContext';

export default function DrawerModal({ isOpen, onClose }) {
  const { theme, toggleTheme } = useContext(ThemeContext);

  const handleThemeToggle = (value) => {
    toggleTheme();
    // Don't close the drawer when toggling theme
  };

  return (
    <Modal transparent visible={isOpen} animationType="slide">
      <Pressable
        style={[styles.overlay, { backgroundColor: theme.text, opacity: 0.2 }]}
        onPress={onClose}
      />
      <View
        style={[
          styles.drawer,
          {
            backgroundColor: theme.background,
            borderRightColor: theme.border,
          },
        ]}
      >
        <Text style={[styles.section, { color: theme.text }]}>Settings</Text>

        {/* Theme Toggle Row - Fixed to not close drawer */}
        <View style={styles.toggleRow}>
          <Ionicons
            name={theme.dark ? 'moon' : 'moon-outline'}
            size={20}
            color={theme.text}
            style={styles.drawerIcon}
          />
          <Text style={[styles.drawerLabel, { color: theme.text }]}>Dark Mode</Text>
          <View style={{ flex: 1 }} />
          <Switch
            trackColor={{ false: '#d1d5db', true: '#10B981' }}
            thumbColor={theme.dark ? '#f4f3f4' : '#f4f3f4'}
            ios_backgroundColor="#d1d5db"
            onValueChange={handleThemeToggle}
            value={theme.dark}
          />
        </View>

        {/* Menu Items */}
        {[
          ['diamond-outline', 'Try premium'],
          ['mail-outline', 'Support'],
          ['star-outline', 'Rate us'],
          ['help-circle-outline', 'Help Center'],
        ].map(([icon, label]) => (
          <TouchableOpacity 
            key={label} 
            style={styles.drawerItem}
            onPress={onClose} // Close drawer when these items are pressed
          >
            <Ionicons name={icon} size={20} color={theme.text} style={styles.drawerIcon} />
            <Text style={[styles.drawerLabel, { color: theme.text }]}>{label}</Text>
          </TouchableOpacity>
        ))}

        <Text style={[styles.section, { color: theme.text }]}>Legal</Text>
        {[
          ['document-text-outline', 'Terms of use'],
          ['document-lock-outline', 'Privacy'],
        ].map(([icon, label]) => (
          <TouchableOpacity 
            key={label} 
            style={styles.drawerItem}
            onPress={onClose} // Close drawer when these items are pressed
          >
            <Ionicons name={icon} size={20} color={theme.text} style={styles.drawerIcon} />
            <Text style={[styles.drawerLabel, { color: theme.text }]}>{label}</Text>
          </TouchableOpacity>
        ))}

        <Text style={[styles.version, { color: theme.mutedText }]}>1.20</Text>
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
    fontSize: 15,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  version: {
    position: 'absolute',
    bottom: 30,
    left: 20,
  },
});