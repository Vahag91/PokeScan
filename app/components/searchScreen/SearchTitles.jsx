import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';

export default function SearchTitles() {
  const { theme } = useContext(ThemeContext);

  return (
    <View style={[styles.container, { backgroundColor: theme.cardCollectionBackground, borderColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.text }]}>🔍 You can search by:</Text>
      <View style={styles.tagsContainer}>
        {[
          { key: 'name', label: 'Name', icon: '✏️' },
          { key: 'artist', label: 'Artist', icon: '🎨' },
          { key: 'rarity', label: 'Rarity', icon: '💎' },
          { key: 'number', label: 'Number', icon: '🔢' },
        ].map(({ key, label, icon }) => (
          <View key={key} style={[styles.tag, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
            <Text style={styles.tagIcon}>{icon}</Text>
            <Text style={[styles.tagText, { color: theme.secondaryText }]}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  title: {
    fontSize: 15,
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
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  tagIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
});