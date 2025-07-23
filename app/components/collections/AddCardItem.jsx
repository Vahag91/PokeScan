import React, { useContext } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ThemeContext } from '../../context/ThemeContext';
import { globalStyles } from '../../../globalStyles';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

export default function AddCardItemVariant2({ onPress }) {
  const { theme } = useContext(ThemeContext);

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.cardCollectionBackground }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.iconBadge}>
        <Ionicons name="add" size={20} color="white" />
      </View>
      <Text style={[globalStyles.smallText, styles.text, { color: theme.text }]}>
        Add a New Card
      </Text>
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
    marginTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderRadius: 16,
  },
  iconBadge: {
    backgroundColor: '#10B981',
    borderRadius: 40,
    padding: 12,
    marginBottom: 10,
  },
  text: {
    textAlign: 'center',
  },
});