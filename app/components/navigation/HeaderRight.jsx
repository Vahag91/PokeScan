import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PaywallModal from '../../screens/PaywallScreen';

export default function HeaderRight() {
  const [isPaywallVisible, setIsPaywallVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={styles.headerRight}
        onPress={() => setIsPaywallVisible(true)}
      >
        <Ionicons name="diamond-sharp" size={20} color="#fff" />
      </TouchableOpacity>

      <PaywallModal
        visible={isPaywallVisible}
        onClose={() => setIsPaywallVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    marginRight: 16,
    backgroundColor: '#6366F1',
    paddingVertical: 4,
    borderRadius: 40,
    paddingHorizontal: 12,
  },
});
