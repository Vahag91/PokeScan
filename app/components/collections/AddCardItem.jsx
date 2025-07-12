// components/collections/AddCardItemVariant2.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

export default function AddCardItemVariant2({ onPress }) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.iconBadge}>
        <Ionicons name="add" size={20} color="white" />
      </View>
      <Text style={styles.text}>Add a New Card</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    marginBottom: 16,
    marginTop:10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  iconBadge: {
    backgroundColor: '#10B981',
    borderRadius: 40,
    padding: 12,
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
});
