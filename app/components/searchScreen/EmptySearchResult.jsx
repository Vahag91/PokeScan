import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../../context/ThemeContext';

function EmptyState({ errorType, errorMessage, retryFetch }) {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);

  if (errorType === 'network') {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.message, { color: theme.text }]}>
          {errorMessage}
        </Text>
        <TouchableOpacity
          onPress={retryFetch}
          style={[styles.retryButton, { backgroundColor: theme.text }]}
        >
          <Text style={[styles.retryText, { color: theme.background }]}>
            {t('common.retry')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (errorType === 'noResults' || errorType === 'invalidInput') {
    return (
      <Text style={[styles.message, styles.mutedMessage, { color: theme.mutedText }]}>
        {errorMessage}
      </Text>
    );
  }

  return null;
}

export default React.memo(EmptyState);

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  message: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    lineHeight: 24,
  },
  mutedMessage: {
    marginTop: 24,
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryText: {
    fontFamily: 'Lato-Bold',
    fontSize: 14,
    lineHeight: 20,
  },
});