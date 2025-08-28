import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { formatFoilLabel } from '../../utils';
import Ionicons from 'react-native-vector-icons/Ionicons';


export default function FoilDropdownPicker({
  selectedFoil,
  availableFoils,
  showDropdown,
  setShowDropdown,
  onSelectFoil,
  theme,
}) {
  const screenWidth = Dimensions.get('window').width;
  const DROPDOWN_WIDTH = screenWidth * 0.5;

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        onPress={() => setShowDropdown(prev => !prev)}
        style={styles.foilSelector}
        activeOpacity={0.85}
      >
        <View style={styles.selectorContent}>
          <Text style={[styles.foilSelectorText, { color: theme.text }]}>
            {formatFoilLabel(selectedFoil)}
          </Text>
          <Ionicons
            name="chevron-down"
            size={16}
            color={theme.text}
            style={styles.icon}
          />
        </View>
      </TouchableOpacity>
      
      {showDropdown && (
        <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
          <View style={styles.fullscreenOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.dropdownList,
                  {
                    width: DROPDOWN_WIDTH,
                    backgroundColor: theme.cardCollectionBackground,
                    borderColor: theme.border,
                    shadowColor: theme.shadowColor,
                  },
                ]}
              >
                {availableFoils.map((foil, index) => {
                  const isSelected = selectedFoil === foil;
                  const isLast = index === availableFoils.length - 1;
                  return (
                    <TouchableOpacity
                      key={foil}
                      style={[
                        styles.dropdownItem,
                        !isLast && styles.dropdownItemBorder(theme),
                        isSelected && styles.dropdownItemSelected(theme),
                      ]}
                      onPress={() => {
                        onSelectFoil(foil);
                        setShowDropdown(false);
                      }}
                      activeOpacity={0.85}
                    >
                      <View style={styles.row}>
                        <Text style={[styles.itemText, { color: theme.text }]}>
                          {formatFoilLabel(foil)}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark" size={16} color={theme.text} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignSelf: 'flex-start',
    width: '100%',
    marginBottom: 6,
    zIndex: 20,
  },
  foilSelector: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginLeft: 6,
  },
  foilSelectorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fullscreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: Dimensions.get('window').height,
    width: '100%',
    zIndex: 999,
  },
  dropdownList: {
    position: 'absolute',
    top: 42,
    borderWidth: 1,
    borderRadius: 10,
    elevation: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  dropdownItemBorder: (theme) => ({
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  }),
  dropdownItemSelected: (theme) => ({
    backgroundColor: theme.inputBackground,
  }),
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 14,
    fontWeight: '500',
  },
});