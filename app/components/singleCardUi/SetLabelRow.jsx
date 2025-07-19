import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function SetLabelRow({ set }) {
  if (!set?.name) return null;

  const logoSource =
    typeof set.logo === 'number'
      ? set.logo
      : set.logo
      ? { uri: set.logo }
      : null;

  return (
    <View style={styles.row}>
      <Text style={styles.label}>Set</Text>
      <View style={styles.valueWrapper}>
        {logoSource && <Image source={logoSource} style={styles.logo} />}
        <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
          {set.name}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#475569',
    width: '30%',
  },
  valueWrapper: {
    flexDirection: 'row',
    justifyContent:"flex-end",
    alignItems: 'center',
    maxWidth: '70%',
    flex: 1,
    marginLeft: 8,
  },
  logo: {
    width: 40,
    height: 20,
    resizeMode: 'contain',
    marginRight: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
    flexShrink: 1,
  },
});