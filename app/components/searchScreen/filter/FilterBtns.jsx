import React, { useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../../../context/ThemeContext';
import { globalStyles } from '../../../../globalStyles';
export default function FilterBtns({ handleClear, handleApply }) {
  const { t } = useTranslation();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { theme } = useContext(ThemeContext);

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
    }).start();
  };

  const handleApplyWithAnim = () => {
    onPressOut();
    handleApply();
  };

  return (
    <View style={[styles.footerButtons, { backgroundColor: theme.background }]}>
      <TouchableOpacity
        onPress={handleClear}
        activeOpacity={0.7}
        style={[styles.clearBtn, { backgroundColor: theme.inputBackground }]}
      >
        <Icon name="close" size={18} color={theme.secondaryText} style={styles.icon} />
        <Text
          style={[
            styles.clearBtnText,
            { color: theme.secondaryText },
            globalStyles.smallText,
          ]}
        >
          {t('common.clear')}
        </Text>
      </TouchableOpacity>

      <TouchableWithoutFeedback
        onPressIn={onPressIn}
        onPressOut={handleApplyWithAnim}
      >
        <Animated.View
          style={[
            styles.applyBtn,
            {
              backgroundColor: '#10B981',
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Icon name="check" size={18} color="#FFFFFF" style={styles.icon} />
          <Text
            style={[
              styles.applyBtnText,
              globalStyles.smallText,
              { color: '#FFFFFF', fontFamily: 'Lato-Bold' },
            ]}
          >
            {t('common.apply')}
          </Text>
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 100,
    flex: 1,
    marginRight: 10,
  },
  clearBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 100,
    flex: 1,
    marginLeft: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  icon: {
    marginRight: 8,
    alignSelf: 'center',
  },
});