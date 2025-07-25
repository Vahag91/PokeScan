import React, { useContext } from 'react';
import { Text, StyleSheet, View, Image, TouchableOpacity } from 'react-native';
import AnimatedSection from './AnimatedSection';
import { ThemeContext } from '../../context/ThemeContext';
import { globalStyles } from '../../../globalStyles';

export default function CardSetHeader({ cardData, onPress }) {
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  const handlePress = () => {
    if (onPress && cardData?.set?.setId) {
      onPress(cardData.set.setId);
    }
  };
  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <AnimatedSection
        style={[
          { backgroundColor: theme.inputBackground, borderColor: theme.border },
        ]}
      >
        <View style={styles.inner}>
          {cardData?.set?.logo && (
            <View
              style={[
                styles.logoWrapper,
                { backgroundColor: theme.background },
              ]}
            >
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
              style={[
                globalStyles.subheading,
                styles.cardName,
                { color: theme.text },
              ]}
            >
              {cardData?.name}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                globalStyles.smallText,
                styles.setName,
                { color: theme.secondaryText },
              ]}
            >
              {cardData?.set?.name}
            </Text>
          </View>
        </View>
      </AnimatedSection>
    </TouchableOpacity>
  );
}

const getStyles = theme =>
  StyleSheet.create({

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
