import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

 function EmptyState({ errorType, errorMessage, retryFetch }) {
  // if (!term.trim() || loading || showLoader) return null;
  if (errorType === 'network') {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.message}>
          {errorMessage}
        </Text>
        <TouchableOpacity onPress={retryFetch} style={styles.retryButton}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (errorType === 'noResults' || errorType === 'invalidInput') {
    return <Text style={styles.message}>{errorMessage}</Text>;
  }
  return null;
}
export default React.memo(EmptyState);

const styles = StyleSheet.create({
  message: { textAlign: 'center', marginTop: 32, color: '#666', fontSize: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 32 },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  retryText: { color: '#fff', fontWeight: '600' },
});
