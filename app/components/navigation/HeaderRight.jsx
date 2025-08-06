import React, { useState, useContext } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PaywallModal from '../../screens/PaywallScreen';
import { SubscriptionContext } from '../../context/SubscriptionContext';

export default function HeaderRight() {
  const { isPremium } = useContext(SubscriptionContext);
  const [isPaywallVisible, setIsPaywallVisible] = useState(false);

  if (isPremium) return null;

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
