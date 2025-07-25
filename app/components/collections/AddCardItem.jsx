import React, { useContext } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ThemeContext } from '../../context/ThemeContext';
import { globalStyles } from '../../../globalStyles';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function AddCardItemVariant2({ onPress }) {
  const { theme } = useContext(ThemeContext);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          shadowColor: theme.shadow || '#000',
        },
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.iconBadge}>
        <Ionicons name="add" size={22} color="white" />
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
    aspectRatio: 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 6,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  iconBadge: {
    backgroundColor: '#10B981',
    borderRadius: 32,
    padding: 14,
    marginBottom: 10,
  },
  text: {
    textAlign: 'center',
    fontWeight: '600',
  },
});