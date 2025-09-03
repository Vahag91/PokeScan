import React, { useContext } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../../context/ThemeContext';
import { globalStyles } from '../../../globalStyles';

export default function AddCollectionCard({ onPress }) {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: theme.cardCollectionBackground,
          borderColor: theme.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.iconWrapper}>
        <Ionicons name="add" size={36} color="#10B981" />
      </View>
      <Text
        style={[globalStyles.smallText, styles.text, { color: theme.text }]}
      >
        {t('collections.create')}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    padding: 16,
    marginTop: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 4,
      },
    }),
  },
  iconWrapper: {
    borderRadius: 50,
    marginBottom: 4,
  },
  text: {
    fontWeight: '600',
  },
});
