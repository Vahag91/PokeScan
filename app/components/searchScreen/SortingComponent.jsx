import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { sortOptions } from '../../constants';
import { HeaderActionButton, BottomSheetHeader } from './filter';
import { ThemeContext } from '../../context/ThemeContext';
import { globalStyles } from '../../../globalStyles';

const sortLabels = {
  price: 'Price',
  name: 'Name',
  date: 'Date',
};

export default function SortingComponent({ sortKey, setSortKey }) {
  const [visible, setVisible] = useState(false);
  const { theme } = useContext(ThemeContext);

  const baseKey = sortKey?.split('-').slice(0, 2).join('-') ?? null;
  const directionFromKey = sortKey?.split('-')[1] ?? 'desc';
  const label = baseKey ? sortLabels[baseKey.split('-')[0]] || 'Sort' : 'Sort';

  const handleSelect = key => {
    const currentDirection = directionFromKey ?? 'desc';
    setSortKey(`${key}-${currentDirection}`);
    setVisible(false);
  };

  const toggleDirection = () => {
    if (!sortKey) return;
    const [base, dir] = sortKey.split('-');
    const newDir = dir === 'asc' ? 'desc' : 'asc';
    setSortKey(`${base}-${newDir}`);
  };

  const resetSort = () => {
    setSortKey(null);
  };

  return (
    <View style={styles.container}>
      <View style={sortKey && styles.controlGroup}>
        {sortKey && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              onPress={toggleDirection}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <View style={styles.actionButtonInner}>
                <Icon
                  name={
                    directionFromKey === 'asc'
                      ? 'arrow-upward'
                      : 'arrow-downward'
                  }
                  size={24}
                  color="#10B981"
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={resetSort}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <View style={styles.actionButtonInner}>
                <Icon name="close" size={24} color="#EF4444" />
              </View>
            </TouchableOpacity>
          </View>
        )}
        <HeaderActionButton
          icon="sort"
          label={label}
          onPress={() => setVisible(true)}
        />
      </View>

      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: theme.background }]}
          >
            <BottomSheetHeader
              title="Sort By"
              onClose={() => setVisible(false)}
              iconSize={22}
            />

            <View style={styles.optionsContainer}>
              {sortOptions.map(option => {
                const isSelected = baseKey === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() => handleSelect(option.key)}
                    style={[
                      styles.optionRow,
                      isSelected && styles.selectedOptionRow,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name={
                        isSelected ? 'check-circle' : 'radio-button-unchecked'
                      }
                      size={22}
                      color={isSelected ? '#10B981' : theme.border}
                      style={styles.optionIcon}
                    />
                    <Text
                      style={[
                        globalStyles.body,
                        styles.optionText,
                        { color: theme.text },
                      ]}
                    >
                      {option.label}
                    </Text>
                    {isSelected && (
                      <Icon
                        name={
                          directionFromKey === 'asc'
                            ? 'arrow-upward'
                            : 'arrow-downward'
                        }
                        size={18}
                        color="#10B981"
                        style={styles.directionIcon}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  controlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  actionButton: {
    padding: 2,
    marginHorizontal: 2,
    borderRadius: 6,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingTop: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  optionsContainer: {
    paddingHorizontal: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  selectedOptionRow: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  optionText: {
    flex: 1,
    marginLeft: 12,
  },
  optionIcon: {
    width: 24,
  },
  directionIcon: {
    marginLeft: 8,
  },
});