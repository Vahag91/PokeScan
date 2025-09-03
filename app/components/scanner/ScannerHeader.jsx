// components/ScannerHeader.js
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const SEG_PADDING = 6; // segmented track padding

export default function ScannerHeader({
  navigation,
  scanLanguage,                 // 'en' | 'jp'
  setScanLanguage,
  showLanguageDropdown,         // kept for compatibility (unused)
  setShowLanguageDropdown,      // kept for compatibility (unused)
  onPressHelp,                  // optional custom help handler
  topInset = 48,                // adjust if you pipe safe area inset
}) {
  const [segWidth, setSegWidth] = useState(228); // room for longer labels
  const [showInfo, setShowInfo] = useState(false);

  const gliderAnim = useRef(new Animated.Value(scanLanguage === 'jp' ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(gliderAnim, {
      toValue: scanLanguage === 'jp' ? 1 : 0,
      duration: 280,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [scanLanguage, gliderAnim]);

  const slotWidth = (segWidth - SEG_PADDING * 2) / 2;
  const translateX = gliderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, slotWidth],
  });

  const setLang = (lang) => {
    if (lang !== scanLanguage) setScanLanguage?.(lang);
  };

  return (
    <>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        {/* Left: Close */}
        <TouchableOpacity
          style={styles.roundBtn}
          onPress={() => navigation?.navigate('Collections')}
          activeOpacity={0.85}
        >
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Center: Segmented Control (absolute center) */}
        <View style={styles.centerWrap} pointerEvents="box-none">
          <View
            style={styles.segmented}
            onLayout={(e) => setSegWidth(e.nativeEvent.layout.width)}
          >
            {/* Glider */}
            <Animated.View
              style={[
                styles.glider,
                {
                  width: slotWidth,
                  transform: [{ translateX }],
                },
              ]}
            />

            {/* EN */}
            <TouchableOpacity
              style={styles.segmentBtn}
              onPress={() => setLang('en')}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.segmentText,
                  scanLanguage === 'en' && styles.segmentTextActive,
                ]}
                numberOfLines={1}
              >
                🇺🇸 English cards
              </Text>
            </TouchableOpacity>

            {/* JP */}
            <TouchableOpacity
              style={styles.segmentBtn}
              onPress={() => setLang('jp')}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.segmentText,
                  scanLanguage === 'jp' && styles.segmentTextActive,
                ]}
                numberOfLines={1}
              >
                🇯🇵 Japanese cards
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Right: Help / Info toggle */}
        <TouchableOpacity
          style={styles.roundBtn}
          onPress={
            onPressHelp
              ? onPressHelp
              : () => setShowInfo((v) => !v)
          }
          activeOpacity={0.85}
        >
          <Ionicons
            name={showInfo ? 'close-circle-outline' : 'help-circle-outline'}
            size={22}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* Info panel (scanning instructions) */}
      {showInfo && (
        <View style={[styles.infoWrap, { top: (topInset || 0) + 64 }]}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>How to get the best scan</Text>
            <Text style={styles.infoText}>
              • Keep the photo <Text style={styles.infoStrong}>clear</Text> — avoid glare and motion blur.
            </Text>
            <Text style={styles.infoText}>
              • Fit a single card fully in the frame, edges visible.
            </Text>
            <Text style={styles.infoText}>
              • Make sure these details are readable:
              <Text style={styles.infoStrong}> Name</Text>, 
              <Text style={styles.infoStrong}> HP</Text>, 
              <Text style={styles.infoStrong}> card number</Text>, 
              <Text style={styles.infoStrong}> Illustrator</Text>.
            </Text>
            <Text style={styles.infoHint}>
              Tip: Lay the card flat under soft light. Tilt slightly to remove harsh reflections.
            </Text>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    left: 0, right: 0, top: 0,
    zIndex: 120,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  roundBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },

  centerWrap: {
    alignItems: 'center',
  },

  segmented: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SEG_PADDING, // 6
    backgroundColor: 'rgba(28,28,30,0.78)',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
    minWidth: 228,
    maxWidth: 280,
  },
  glider: {
    position: 'absolute',
    left: SEG_PADDING,
    top: SEG_PADDING,
    bottom: SEG_PADDING,
    backgroundColor: '#E9E9EB',
    borderRadius: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },
  segmentBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    zIndex: 2,
    minWidth: 96,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#E5E5EA',
    fontWeight: '700',
    fontFamily: 'Lato-Bold',
  },
  segmentTextActive: {
    color: '#000',
  },

  // Info panel
  infoWrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 110,
  },
  infoCard: {
    backgroundColor: 'rgba(0,0,0,0.82)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  infoTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
    fontFamily: 'Lato-Bold',
  },
  infoText: {
    color: '#CBD5E1',
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 4,
    fontFamily: 'Lato-Regular',
  },
  infoStrong: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontFamily: 'Lato-Bold',
  },
  infoHint: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
});
