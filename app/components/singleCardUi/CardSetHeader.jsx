import AnimatedSection from './AnimatedSection';
import { Text, StyleSheet, View } from 'react-native';
import { FasterImageView } from '@rraut/react-native-faster-image';

export default function CardSetHeader({ cardData }) {
  return (
    <AnimatedSection style={styles.container}>
      <View style={styles.inner}>
        {cardData?.set?.logo && (
          <View style={styles.logoWrapper}>
            <FasterImageView
              source={
                typeof cardData.set.logo === 'number'
                  ? cardData.set.logo
                  : { uri: cardData.set.logo }
              }
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        )}
        <View style={styles.info}>
          <Text numberOfLines={1} style={styles.cardName}>
            {cardData?.name}
          </Text>
          <Text numberOfLines={1} style={styles.setName}>
            {cardData?.set?.name}
          </Text>
        </View>
      </View>
    </AnimatedSection>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoWrapper: {
    width: 65,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  cardName: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  setName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
});