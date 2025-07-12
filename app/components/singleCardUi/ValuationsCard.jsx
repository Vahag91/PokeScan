// components/ValuationsCard.js
import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  StyleSheet
} from 'react-native'

export default function ValuationsCard({ url, prices }) {
  // Turn the prices object into an array of [key, data] pairs
  const variants = Object.entries(prices).filter(([_, data]) => data)

  return (
    <View style={styles.container}>
      {variants.map(([key, data]) => {
        const label = key === 'normal' ? 'Normal' : 'Reverse Holo'
        return (
          <TouchableOpacity
            key={key}
            style={styles.card}
            onPress={() => Linking.openURL(`${url}?variant=${key}`)}
            activeOpacity={0.8}
          >
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.mid}>${data.mid.toFixed(2)}</Text>
            <Text style={styles.range}>
              L: ${data.low.toFixed(2)} · H: ${data.high.toFixed(2)}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  card: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  mid: {
    fontSize: 18,
    fontWeight: '700',
  },
  range: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
})
