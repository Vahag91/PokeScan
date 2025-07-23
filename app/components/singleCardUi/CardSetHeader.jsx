import React, { useContext } from 'react';
import { Text, StyleSheet, View, Image } from 'react-native';
import AnimatedSection from './AnimatedSection';
import { ThemeContext } from '../../context/ThemeContext';
import { globalStyles } from '../../../globalStyles';
export default function CardSetHeader({ cardData }) {
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  return (
    <AnimatedSection
      style={[styles.container, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
    >
      <View style={styles.inner}>
        {cardData?.set?.logo && (
          <View style={[styles.logoWrapper, { backgroundColor: theme.background }]}>
            <Image
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
          <Text
            numberOfLines={1}
            style={[globalStyles.subheading, styles.cardName, { color: theme.text }]}
          >
            {cardData?.name}
          </Text>
          <Text
            numberOfLines={1}
            style={[globalStyles.smallText, styles.setName, { color: theme.secondaryText }]}
          >
            {cardData?.set?.name}
          </Text>
        </View>
      </View>
    </AnimatedSection>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      borderRadius: 16,
      paddingVertical: 18,
      paddingHorizontal: 20,
      marginBottom: 20,
      borderWidth: 1,
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
      marginBottom: 4,
    },
    setName: {},
  });