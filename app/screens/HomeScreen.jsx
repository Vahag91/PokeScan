import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SectionList,
  Image,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { categories } from '../constants';

export default function HomeScreen() {
  const navigation = useNavigation();


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.centerIcon}>
        <Icon name="camera-outline" size={64} color="#666" />
        <View style={styles.stars}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Icon key={i} name="star" size={18} color="#666" />
          ))}
        </View>
      </View>

      <View style={styles.searchBox}>
        <Icon name="search-outline" size={18} color="#aaa" />
        <TextInput
          placeholder="Enter the name"
          placeholderTextColor="#888"
          style={styles.input}
        />
      </View>

      <SectionList
        sections={categories}
        keyExtractor={item => item.id}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionTitle}>{title}</Text>
        )}
        renderItem={({ item, index, section }) => {
          const isFirstInRow = index % 2 === 0;
          const nextItem = section.data[index + 1];

          if (!isFirstInRow) return null;

          return (
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('SetDetail', { setId: item.id })}
              >
                <Image source={item.image} style={styles.image} />
                <Text style={styles.cardText}>{item.title}</Text>
              </TouchableOpacity>

              {nextItem && (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => navigation.navigate('SetDetail', { setId: nextItem.id })}
                >
                  <Image source={nextItem.image} style={styles.image} />
                  <Text style={styles.cardText}>{nextItem.title}</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        contentContainerStyle={styles.gridContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerIcon: {
    alignItems: 'center',
    marginVertical: 20,
  },
  stars: {
    flexDirection: 'row',
    marginTop: 8,
  },
  searchBox: {
    flexDirection: 'row',
    backgroundColor: '#F1F1F1',
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  input: {
    color: '#1A1A1A',
    padding: 10,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#444',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  gridContent: {
    paddingBottom: 60,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 12,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  image: {
    height: 80,
    width: 140,
    borderRadius: 8,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  cardText: {
    textAlign: 'center',
    color: '#1A1A1A',
    fontWeight: '500',
  },
});