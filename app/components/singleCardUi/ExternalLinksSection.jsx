import React from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  View,
  Image,
} from 'react-native';
import AnimatedSection from './AnimatedSection';
import { globalStyles } from '../../../globalStyles';

const platformData = {
  tcgplayer: {
    name: 'TCG Player',
    icon: require('../../assets/cards/other/tcgplayericon.png'),
  },
  cardmarket: {
    name: 'Cardmarket',
    icon: require('../../assets/cards/other/cardmarket.webp'),
  },
};

export default function ExternalLinksSection({ cardData, theme }) {
  if (!cardData?.tcgplayer?.url && !cardData?.cardmarket?.url) return null;

  const styles = getStyles(theme);

  return (
    <AnimatedSection style={styles.sectionContainer}>
      <Text style={[globalStyles.subheader, styles.sectionTitle]}>
        Purchase Options
      </Text>

      <View style={styles.buttonsContainer}>
        {['tcgplayer', 'cardmarket'].map((key) => {
          const data = platformData[key];
          const url = cardData?.[key]?.url;
          if (!url) return null;

          return (
            <TouchableOpacity
              key={key}
              activeOpacity={0.9}
              onPress={() => Linking.openURL(url)}
              style={styles.button}
            >
              <Image
                source={data.icon}
                style={styles.platformIcon}
                resizeMode="contain"
              />
              <Text style={styles.arrowText}>→</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </AnimatedSection>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    sectionContainer: {
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    sectionTitle: {
      color: theme.text,
      marginBottom: 12,
      fontSize: 15,
      fontWeight: '500',
    },
    buttonsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
    },
    button: {
      flex: 1,
      minWidth: '48%',
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: 'white',
    },
    platformIcon: {
      width: 120,
      height: 40,
      marginRight: 8,
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '500',
      flex: 1,
      color: theme.text,
    },
    arrowText: {
      fontSize: 16,
      color: theme.secondaryText,
    },
  });