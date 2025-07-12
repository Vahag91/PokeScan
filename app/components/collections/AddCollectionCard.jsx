import { TouchableOpacity, Text, StyleSheet, View, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function AddCollectionCard({ onPress }) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.iconWrapper}>
        <Ionicons name="add" size={28} color="#10B981" />
      </View>
      <Text style={styles.text}>New Collection</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 100,
    marginHorizontal: 12,
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',

    // Cross-platform shadow
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
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 50,
    marginBottom: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
  },
});
