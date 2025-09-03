// LanguageToggleChips.js
import React, { useContext, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';

// --- helpers -------------------------------------------------
function parseColorToRGB(c) {
  if (!c || typeof c !== 'string') return null;

  // #RRGGBB or #RGB
  if (c[0] === '#') {
    const hex = c.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return { r, g, b };
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b };
    }
    return null;
  }

  // rgb(a)
  const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (m) {
    return { r: +m[1], g: +m[2], b: +m[3] };
  }
  return null;
}

function isLightTheme(theme) {
  // explicit flags first
  if (typeof theme?.isLight === 'boolean') return theme.isLight;
  if (typeof theme?.isDark === 'boolean') return !theme.isDark;
  if (typeof theme?.mode === 'string') return theme.mode.toLowerCase() === 'light';
  if (typeof theme?.name === 'string') return theme.name.toLowerCase() === 'light';

  // infer from text color (dark text -> light theme)
  const rgb = parseColorToRGB(theme?.text || '#E5E7EB');
  if (rgb) {
    const { r, g, b } = rgb;
    // relative luminance-ish (simple)
    const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; // 0..1
    // if text is dark (<0.5), we assume light theme UI (dark text on light bg)
    return l < 0.5;
  }
  // default dark
  return false;
}
// -------------------------------------------------------------

export default function LanguageToggleChips({
  value,
  onChange,
  options = [
    { key: 'en', label: '🇺🇸 English cards' },
    { key: 'jp', label: '🇯🇵 Japanese cards' },
  ],
  style = {},
  textStyle = {},
  chipPaddingHorizontal = 12, // Default to 12px, can be overridden
}) {
  const { theme } = useContext(ThemeContext);
  const lightUI = useMemo(() => isLightTheme(theme), [theme]);

  return (
    <View style={[styles.row, style]}>
      {options.map(opt => {
        const selected = value === opt.key;

        const bg = selected
          ? (lightUI ? 'rgba(16, 185, 129, 0.22)' : 'rgba(16, 185, 129, 0.18)')
          : (theme?.cardBackground || 'rgba(255, 255, 255, 0.08)');

        const border = selected
          ? (lightUI ? 'rgba(16, 185, 129, 0.85)' : 'rgba(16, 185, 129, 0.7)')
          : (theme?.border || 'rgba(255, 255, 255, 0.15)');

        // Key fix: selected text color adapts to theme
        const txtColor = selected
          ? (lightUI ? '#065F46' : '#FFFFFF') // dark teal on light UI, white on dark UI
          : (theme?.text || '#E5E7EB');

        const ringBorder = selected ? '#10B981' : 'rgba(255,255,255,0.4)';
        const ringBg = selected ? (lightUI ? 'rgba(16,185,129,0.18)' : 'rgba(16,185,129,0.2)') : 'transparent';

        return (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.chip,
              {
                backgroundColor: bg,
                borderColor: border,
                shadowColor: selected ? '#10B981' : theme?.shadowColor || '#000',
                paddingHorizontal: chipPaddingHorizontal,
              },
              selected && styles.chipActive,
            ]}
            onPress={() => onChange(opt.key)}
            activeOpacity={0.85}
          >
            <Text style={styles.flag}>{opt.label.split(' ')[0]}</Text>
            <Text
              numberOfLines={1}
              style={[
                styles.txt,
                { color: txtColor, fontWeight: selected ? '800' : '600' },
                textStyle,
              ]}
            >
              {opt.label.replace(/^[^\s]+\s?/, '')}
            </Text>

            <View style={[styles.ring, { borderColor: ringBorder, backgroundColor: ringBg }]}>
              {selected ? <View style={styles.dot} /> : null}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  chipActive: {
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  flag: {
    fontSize: 16,
    marginRight: 2,
    opacity: 0.95,
  },
  txt: {
    fontSize: 13.5,
    fontFamily: 'Lato-Bold',
    letterSpacing: 0.2,
  },
  ring: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
});
