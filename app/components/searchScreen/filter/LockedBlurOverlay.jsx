import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { ThemeContext } from '../../../context/ThemeContext';

export default function LockedBlurOverlay({
  onPress,
  onClose,
  title = 'Premium Features Locked',
  subtitle = 'Upgrade to unlock all professional tools and filters',
  buttonText = 'Unlock Premium',
}) {
  const { theme } = useContext(ThemeContext);

  return (
    <View style={styles.absoluteFill}>
      {/* ✅ Blur background */}
      <BlurView
        style={styles.absoluteFill}
        blurType={theme.blurType || 'light'}
        blurAmount={0}
        reducedTransparencyFallbackColor={theme.blurFallback}
      />

      {/* ✅ Overlay gradient */}
      <LinearGradient
        colors={[theme.overlayDark, theme.overlayDarker]}
        style={styles.absoluteFill}
      />

      {/* ✅ Close button */}
      <TouchableOpacity
        onPress={onClose}
        style={[styles.closeBtn, { color: theme.buttonBackground }]}
        activeOpacity={0.8}
        accessibilityLabel="Close Overlay"
      >
        <Ionicons name="close" size={28} color={theme.text} />
      </TouchableOpacity>

      {/* ✅ Content */}
      <View style={styles.lockedOverlay}>
        <Animated.View style={[styles.iconContainer, styles.iconElevation]}>
          <LinearGradient
            colors={theme.iconGradient}
            style={styles.gradientCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name="lock-open" size={28} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>

        <Text style={[styles.lockedTitle, { color: theme.textPrimary }]}>
          {title}
        </Text>
        <Text style={[styles.lockedSubtitle, { color: theme.textSecondary }]}>
          {subtitle}
        </Text>

        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.9}
          style={[styles.pillButton, { borderColor: theme.buttonBorder }]}
        >
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  closeBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
  },
  lockedOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  gradientCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconElevation: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  lockedTitle: {
    fontFamily: 'Lato-Bold',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  lockedSubtitle: {
    fontFamily: 'Lato-Regular',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  pillButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 16,
  },
  buttonText: {
    fontFamily: 'Lato-BoldItalic',
    color: '#FFF',
    fontSize: 18,
    letterSpacing: 0.5,
  },
});
