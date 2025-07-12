import { View, Text, StyleSheet } from 'react-native';

export default function LabelRow({ label, value, subtext }) {
  return (
    <View style={styles.row}>
      <View style={styles.labelBox}>
        {typeof label === 'string' ? (
          <Text style={styles.label}>{label}</Text>
        ) : (
          label
        )}
        {subtext && <Text style={styles.subLabel}>{subtext}</Text>}
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  labelBox: {
    flex: 1,
    marginRight: 10,
  },
  label: {
    color: '#444',
    fontSize: 15,
    fontWeight: '500',
  },
  subLabel: {
    color: '#999',
    fontSize: 13,
    marginTop: 2,
  },
  value: {
    color: '#111',
    fontSize: 15,
    fontWeight: '600',
  },
});
