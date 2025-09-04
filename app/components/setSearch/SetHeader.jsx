import React, { useContext } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../../context/ThemeContext';
import { globalStyles } from '../../../globalStyles';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function SetHeader({ cards }) {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();

  const set = cards?.[0]?.set;
  const setName = set?.name || 'Cards in Set';
  const setSymbol = set?.images?.symbol;
  const setLogo = set?.images?.logo;
  const releaseDate = set?.releaseDate;
  const totalCards =  set?.total || cards.length;

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>  
      <Image source={{ uri: setLogo }} style={styles.setLogo} />
      <View style={styles.nameRow}>
        {setSymbol && <Image source={{ uri: setSymbol }} style={styles.setSymbol} />}
        <Text
          numberOfLines={1}
          style={[globalStyles.heading, styles.setName, { color: theme.text }]}
        >
          {setName}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <View style={styles.metaBox}>
          <Ionicons name="calendar-outline" size={16} color={theme.secondaryText} />
          <Text style={[styles.metaLabel, { color: theme.secondaryText }]}>{t('sets.release')}</Text>
          <Text style={[styles.metaValue, { color: theme.text }]}>{releaseDate}</Text>
        </View>
        <View style={styles.metaBox}>
          <Ionicons name="albums-outline" size={16} color={theme.secondaryText} />
          <Text style={[styles.metaLabel, { color: theme.secondaryText }]}>{t('sets.cards')}</Text>
          <Text style={[styles.metaValue, { color: theme.text }]}>{totalCards}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  setLogo: {
    width: 160,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  setSymbol: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  setName: {
    fontSize: 20,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
  metaBox: {
    flexDirection:"row",
    alignItems: 'end',
    gap: 6,
  },
  metaLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 15,
    fontWeight: '600',
  },
});