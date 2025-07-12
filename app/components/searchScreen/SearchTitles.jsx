import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SearchTitles() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 You can search by:</Text>
      <View style={styles.tagsContainer}>
        {[
          { key: 'name', label: 'Name', icon: '✏️' },
          { key: 'artist', label: 'Artist', icon: '🎨' },
          { key: 'rarity', label: 'Rarity', icon: '💎' },
          { key: 'number', label: 'Number', icon: '🔢' },
        ].map(({ key, label, icon }) => (
          <View key={key} style={styles.tag}>
            <Text style={styles.tagIcon}>{icon}</Text>
            <Text style={styles.tagText}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9fafb',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  title: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2f7',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  tagIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
});
