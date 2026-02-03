import React, { useRef, useState, useContext, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  Animated,
  Easing,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../context/ThemeContext';
import RateUsService from '../services/RateUsService';

const { width, height } = Dimensions.get('window');

const getSlides = (theme, t) => [
  {
    key: '1',
    image:  require('../assets/onboarding/scandark.png'),
    title: t('onboarding.slide1.title'),
    subtitle: t('onboarding.slide1.subtitle'),
  },
  {
    key: '2',
    image: theme === 'dark'
      ? require('../assets/onboarding/searchdark.png')
      : require('../assets/onboarding/searchlight.png'),
    title: t('onboarding.slide2.title'),
    subtitle: t('onboarding.slide2.subtitle'),
  },
  {
    key: '3',
    image: theme === 'dark'
      ? require('../assets/onboarding/collectiondark.png')
      : require('../assets/onboarding/collectionlight.png'),
    title: t('onboarding.slide3.title'),
    subtitle: t('onboarding.slide3.subtitle'),
  },
  {
    key: '4',
    image: theme === 'dark'
      ? require('../assets/onboarding/pricedark.png')
      : require('../assets/onboarding/pricelight.png'),
    title: t('onboarding.slide4.title'),
    subtitle: t('onboarding.slide4.subtitle'),
  },
];

export default function NewOnboarding({ onDone }) {
  const { t } = useTranslation();
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const buttonScale = useRef(new Animated.Value(1)).current;
  const { themeName, theme } = useContext(ThemeContext);
  const slides = useMemo(() => getSlides(themeName, t), [themeName, t]);
  const continuePressCountRef = useRef(0);
  const ratePromptTriggeredRef = useRef(false);

  const backgroundImage = themeName === 'dark'
    ? require('../assets/onboarding/darkpaywall.png')
    : require('../assets/onboarding/lightpaywall.png');

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 1.05,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 700,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const maybeShowRatePromptOnThirdContinue = async () => {
    if (ratePromptTriggeredRef.current) {
      return;
    }

    ratePromptTriggeredRef.current = true;

    try {
      const shouldShow = await RateUsService.shouldShowRatePrompt();
      if (shouldShow) {
        await RateUsService.showRatePrompt();
      }
    } catch (error) {
      // Ignore errors from rate prompt attempts during onboarding
    }
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const isThirdContinue = continuePressCountRef.current === 2;
      continuePressCountRef.current += 1;
      if (isThirdContinue) {
        void maybeShowRatePromptOnThirdContinue();
      }

      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      onDone();
    }
  };

  const renderItem = ({ item, index }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    const rotateY = scrollX.interpolate({
      inputRange,
      outputRange: ['-60deg', '0deg', '60deg'],
    });

    const translateX = scrollX.interpolate({
      inputRange,
      outputRange: [width * 0.7, 0, -width * 0.7],
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
    });

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.7, 1, 0.7],
    });

    return (
      <Animated.View
        style={[
          styles.slide,
          {
            opacity,
            transform: [{ perspective: 1000 }, { translateX }, { rotateY }, { scale }],
          },
        ]}
      >
        {item.image && (
          <Image
            source={item.image}
            style={[styles.image, item.key === '2' && styles.imageLarger]}
            resizeMode="contain"
          />
        )}
        {item.title && (
          <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
        )}
        {item.subtitle && (
          <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
            {item.subtitle}
          </Text>
        )}
      </Animated.View>
    );
  };

  const renderDots = () => {
    const dotPosition = Animated.divide(scrollX, width);

    return (
      <View style={styles.dotsContainer}>
        {slides.map((_, i) => {
          const rotate = dotPosition.interpolate({
            inputRange: [i - 1, i, i + 1],
            outputRange: ['0deg', '45deg', '0deg'],
            extrapolate: 'clamp',
          });

          const backgroundColor = dotPosition.interpolate({
            inputRange: [i - 1, i, i + 1],
            outputRange: [
              'rgba(255,255,255,0.3)',
              '#10B981',
              'rgba(255,255,255,0.3)',
            ],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  transform: [{ rotate }],
                  backgroundColor,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };


  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <View style={styles.overlayContainer}>
        <Animated.FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderItem}
          keyExtractor={(item) => item.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            {
              useNativeDriver: true,
              listener: (e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                setCurrentIndex(index);
              },
            }
          )}
          scrollEventThrottle={16}
        />

        {renderDots()}

        <Animated.View style={{ transform: [{ scale: buttonScale }], marginTop: 6 }}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#10B981' }]}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {currentIndex === slides.length - 1 ? t('onboarding.getStarted') : t('onboarding.continue')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: height * 0.04,
    paddingBottom: height * 0.04,
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: width * 0.06,
    backfaceVisibility: 'hidden',
  },
  image: {
    width: width * 0.6,
    height: height * 0.6,
    marginBottom: 15,
  },
  imageLarger: {
    width: width * 0.95,
    height: height * 0.65,
  },
  title: {
    fontSize: width < 768 ? 26 : 35,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: width < 768 ? 15 : 20,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
    lineHeight: 24,
  },
  button: {
    paddingVertical: 16,
    marginHorizontal: width * 0.1,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: width < 768 ? 18 : 22,
    letterSpacing: 0.5,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 18,
    marginBottom: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 6,
  },
});
