import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { ThemeContext } from '../../../context/ThemeContext';
import { globalStyles } from '../../../../globalStyles';
export default function HPRangeSlider({ hpRange, setHpRange }) {
  const { theme } = useContext(ThemeContext);

  const isValidRange =
    Array.isArray(hpRange) &&
    hpRange.length === 2 &&
    hpRange.every(v => typeof v === 'number');

  const safeRange = isValidRange ? hpRange : [0, 340];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.cardCollectionBackground },
      ]}
    >
      <MultiSlider
        values={safeRange}
        sliderLength={280}
        onValuesChange={setHpRange}
        min={0}
        max={340}
        step={10}
        selectedStyle={{ backgroundColor: '#10B981' }}
        unselectedStyle={{ backgroundColor: theme.border }}
        markerStyle={styles.marker}
        containerStyle={styles.slider}
      />
      <View style={styles.rangeText}>
        <Text style={[globalStyles.smallText, styles.value, { color: theme.text }]}>
          {safeRange[0]} HP
        </Text>
        <Text style={[globalStyles.smallText, styles.value, { color: theme.text }]}>
          {safeRange[1]} HP
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20,
  },
  slider: {
    alignSelf: 'center',
  },
  marker: {
    backgroundColor: '#10B981',
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 3,
  },
  rangeText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  value: {
    fontWeight: '600',
  },
});