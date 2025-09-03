import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  ScrollView,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  FilterBtns,
  FilterSectionToggle,
  HPRangeSlider,
  IconOptions,
  RegulationMarkOptions,
  CardLegalityOptions,
  HeaderActionButton,
  BottomSheetHeader,
} from './filter';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { typeIcons, rarityColors } from '../../constants';
import { getContrastColor } from '../../utils';
import { ThemeContext } from '../../context/ThemeContext';
import { SubscriptionContext } from '../../context/SubscriptionContext';
import { globalStyles } from '../../../globalStyles';
import PaywallModal from '../../screens/PaywallScreen';
import LockedBlurOverlay from './filter/LockedBlurOverlay';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const rarityOptions = Object.keys(rarityColors);
const typeOptions = Object.keys(typeIcons);
const attackOptions = typeOptions.filter(t => t !== 'Dragon');

export default function FilterComponent({ filters, setFilters }) {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);
  const { isPremium } = useContext(SubscriptionContext);

  const [visible, setVisible] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const [selectedRarities, setSelectedRarities] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedAttack, setSelectedAttack] = useState([]);
  const [selectedRegulations, setSelectedRegulations] = useState([]);
  const [selectedLegalities, setSelectedLegalities] = useState([]);
  const [hpRange, setHpRange] = useState([0, 340]);
  const [expanded, setExpanded] = useState({
    rarity: false,
    type: false,
    attack: false,
    hp: false,
    regulation: false,
    legality: false,
  });

  const toggleSelection = (list, setList, value) => {
    setList(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value],
    );
  };

  const handleSelectAll = (options, selected, setSelected) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const allSelected = options.every(o => selected.includes(o));
    setSelected(allSelected ? [] : [...options]);
  };

  const handleClear = () => {
    setSelectedRarities([]);
    setSelectedTypes([]);
    setSelectedAttack([]);
    setHpRange(null);
    setSelectedRegulations([]);
    setSelectedLegalities([]);
    setFilters({
      rarity: [],
      type: [],
      attack: [],
      hp: null,
      regulation: [],
      legality: [],
    });
  };

  const handleApply = () => {
    setFilters({
      rarity: selectedRarities,
      type: selectedTypes,
      attack: selectedAttack,
      hp: hpRange,
      regulation: selectedRegulations,
      legality: selectedLegalities,
    });
    setVisible(false);
  };

  const toggleExpand = key => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderSelectAllRow = (label, options, selected, setSelected) => {
    const allSelected = options.every(opt => selected.includes(opt));
    return (
      <TouchableOpacity
        onPress={() => handleSelectAll(options, selected, setSelected)}
        style={styles.selectAllRow}
        activeOpacity={0.75}
      >
        <Icon
          name={allSelected ? 'remove-circle-outline' : 'done-all'}
          size={20}
          color="#10B981"
          style={styles.selectAllIcon}
        />
        <Text
          style={[
            globalStyles.smallText,
            styles.selectAllText,
            { color: theme.text },
          ]}
        >
          {allSelected ? t('search.deselectAll', { label }) : t('search.selectAll', { label })}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {(filters.rarity.length ||
          filters.type.length ||
          filters.attack.length ||
          filters.hp !== null ||
          filters.regulation.length ||
          filters.legality.length) > 0 && (
          <HeaderActionButton
            icon="close"
            label=""
            variant="icon"
            onPress={handleClear}
          />
        )}
        <HeaderActionButton
          icon="filter-list"
          label={t('search.filters')}
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
              title={t('search.filters')}
              onClose={() => setVisible(false)}
              iconSize={24}
            />

            <ScrollView style={styles.optionsContainer}>
              <FilterSectionToggle
                label={t('search.filtersRarity')}
                expanded={expanded.rarity}
                onPress={() => toggleExpand('rarity')}
              />
              {expanded.rarity && (
                <View style={styles.sectionBlock}>
                  {renderSelectAllRow(
                    t('search.filtersRarity'),
                    rarityOptions,
                    selectedRarities,
                    setSelectedRarities,
                  )}
                  <View style={styles.chipWrap}>
                    {rarityOptions.map(r => {
                      const selected = selectedRarities.includes(r);
                      const bg = rarityColors[r] || '#e0e0e0';
                      const textColor = getContrastColor(bg);
                      return (
                        <TouchableOpacity
                          key={r}
                          onPress={() =>
                            toggleSelection(
                              selectedRarities,
                              setSelectedRarities,
                              r,
                            )
                          }
                          style={[
                            styles.rarityChip,
                            selected && { backgroundColor: bg },
                          ]}
                        >
                          <Text
                            style={[
                              globalStyles.caption,
                              styles.rarityChipText,
                              {
                                color: selected ? textColor : theme.rarityText,
                              },
                            ]}
                          >
                            {r}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
              <FilterSectionToggle
                label={t('search.filtersEnergyType')}
                expanded={expanded.type}
                onPress={() => toggleExpand('type')}
              />
              {expanded.type && (
                <View style={styles.sectionBlock}>
                  {renderSelectAllRow(
                    t('search.filtersType'),
                    typeOptions,
                    selectedTypes,
                    setSelectedTypes,
                  )}
                  <IconOptions
                    options={typeOptions}
                    selectedList={selectedTypes}
                    setList={setSelectedTypes}
                    toggleSelection={toggleSelection}
                  />
                </View>
              )}
              <FilterSectionToggle
                label={t('search.filtersAttackCost')}
                expanded={expanded.attack}
                onPress={() => toggleExpand('attack')}
              />
              {expanded.attack && (
                <View style={styles.sectionBlock}>
                  {renderSelectAllRow(
                    t('search.filtersAttack'),
                    attackOptions,
                    selectedAttack,
                    setSelectedAttack,
                  )}
                  <IconOptions
                    options={attackOptions}
                    selectedList={selectedAttack}
                    setList={setSelectedAttack}
                    toggleSelection={toggleSelection}
                  />
                </View>
              )}
              <FilterSectionToggle
                label={t('search.filtersHPRange')}
                expanded={expanded.hp}
                onPress={() => toggleExpand('hp')}
              />
              {expanded.hp && (
                <View style={styles.sectionBlock}>
                  <HPRangeSlider hpRange={hpRange} setHpRange={setHpRange} />
                </View>
              )}
              <FilterSectionToggle
                label={t('search.filtersRegulationMark')}
                expanded={expanded.regulation}
                onPress={() => toggleExpand('regulation')}
              />
              {expanded.regulation && (
                <View style={styles.sectionBlock}>
                  <RegulationMarkOptions
                    selected={selectedRegulations}
                    setSelected={setSelectedRegulations}
                  />
                </View>
              )}
              <FilterSectionToggle
                label={t('search.filtersCardLegality')}
                expanded={expanded.legality}
                onPress={() => toggleExpand('legality')}
              />
              {expanded.legality && (
                <View style={styles.sectionBlock}>
                  <CardLegalityOptions
                    selected={selectedLegalities}
                    setSelected={setSelectedLegalities}
                  />
                </View>
              )}
            </ScrollView>

            <FilterBtns handleApply={handleApply} handleClear={handleClear} />

            {!isPremium && (
              <LockedBlurOverlay
                title={t('search.advancedFiltersLocked')}
                subtitle={t('search.advancedFiltersSubtitle')}
                buttonText={t('search.unlockPremium')}
                onPress={() => {
                  setVisible(false);
                  setTimeout(() => setShowPaywall(true), 200);
                }}
                onClose={()=>setVisible(false)}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* 💰 Paywall Modal */}
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: 16, marginBottom: 8 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingTop: 20,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '75%',
  },
  optionsContainer: { paddingHorizontal: 16 },
  sectionBlock: { paddingTop: 6, marginBottom: 14 },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  selectAllText: {
    marginLeft: 0,
  },
  selectAllIcon: { marginRight: 8 },
  rarityChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#F1F5F9',
  },
  rarityChipText: {
    marginLeft: 0,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 0,
  },
  lockedOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  lockedText: {
    textAlign: 'center',
    marginTop: 12,
    color: '#374151',
  },
});
