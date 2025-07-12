import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'

const DrawerItem = ({ icon, label }) => (
  <TouchableOpacity style={styles.item}>
    <Ionicons name={icon} size={20} color="#fff" style={styles.icon} />
    <Text style={styles.label}>{label}</Text>
  </TouchableOpacity>
)

export default function CustomDrawer() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.section}>Settings</Text>
        <DrawerItem icon="diamond-outline" label="Try premium" />
        <DrawerItem icon="mail-outline" label="Support" />
        <DrawerItem icon="star-outline" label="Rate us" />
        <DrawerItem icon="help-circle-outline" label="Help Center" />

        <Text style={styles.section}>Legal</Text>
        <DrawerItem icon="document-text-outline" label="Terms of use" />
        <DrawerItem icon="document-lock-outline" label="Privacy" />
      </ScrollView>
      <Text style={styles.version}>1.20</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0e10',
    paddingTop: 50,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  scroll: {
    paddingBottom: 30,
  },
  section: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 30,
    marginBottom: 15,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  icon: {
    marginRight: 12,
  },
  label: {
    color: '#fff',
    fontSize: 15,
  },
  version: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
})
