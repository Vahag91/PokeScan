import React, { useRef } from 'react';
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

export default function FilterBtns({ handleClear, handleApply }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

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
    <View style={styles.footerButtons}>
      <TouchableOpacity
        onPress={handleClear}
        activeOpacity={0.7}
        style={styles.clearBtn}
      >
        <Icon name="close" size={18} color="#64748B" style={styles.icon} />
        <Text style={styles.clearBtnText}>Clear</Text>
      </TouchableOpacity>

      <TouchableWithoutFeedback
        onPressIn={onPressIn}
        onPressOut={handleApplyWithAnim}
      >
        <Animated.View style={[styles.applyBtn, { transform: [{ scale: scaleAnim }] }]}>
          <Icon name="check" size={18} color="#FFFFFF" style={styles.icon} />
          <Text style={styles.applyBtnText}>Apply</Text>
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
    backgroundColor: '#fff',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 100,
    backgroundColor: '#F8FAFC',
    flex: 1,
    marginRight: 10,
  },
  clearBtnText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 15,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 100,
    backgroundColor: '#10B981', // Change this to your preferred color (e.g. emerald)
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
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  icon: {
    marginRight: 8,
    alignSelf: 'center',
  },
});
