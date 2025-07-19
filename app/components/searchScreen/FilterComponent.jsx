import React, { useState } from 'react';
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

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const rarityOptions = Object.keys(rarityColors);
const typeOptions = Object.keys(typeIcons);
const attackOptions = typeOptions.filter(t => t !== 'Dragon');
// const regulationOptions = ['D', 'E', 'F', 'G', 'H'];

export default function FilterComponent({ filters, setFilters }) {
  const [visible, setVisible] = useState(false);
  const [selectedRarities, setSelectedRarities] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedAttack, setSelectedAttack] = useState([]);
  // const [selectedSupertypes, setSelectedSupertypes] = useState([]);
  const [selectedRegulations, setSelectedRegulations] = useState([]);
  const [selectedLegalities, setSelectedLegalities] = useState([]);

  const [hpRange, setHpRange] = useState([0, 340]);

  const [expanded, setExpanded] = useState({
    rarity: false,
    type: false,
    attack: false,
    hp: false,
    // supertype: false,
    regulation: false,
    legality: false,
  });

  // useEffect(() => {
  //   if (!filters.rarity?.length) setSelectedRarities(rarityOptions);
  //   if (!filters.type?.length) setSelectedTypes(typeOptions);
  //   if (!filters.attack?.length) setSelectedAttack(attackOptions);
  //   if (!filters.hp) setHpRange([0, 340]);
  //   if (!filters.supertype?.length) {
  //     setSelectedSupertypes(['Pokémon', 'Trainer', 'Energy']); // or whatever supertypes you support
  //   }
  //   if (!filters.regulation?.length) setSelectedRegulations(regulationOptions);
  //   if (!filters.legality?.length) {
  //     setSelectedLegalities(['Standard', 'Expanded', 'Unlimited']);
  //   }
  // }, [filters]);

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
    // setSelectedSupertypes([]);
    setSelectedRegulations([]);
    setSelectedLegalities([]);

    setFilters({
      rarity: [],
      type: [],
      attack: [],
      hp: null,
      // supertype: [],
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
      // hp: selectedSupertypes.includes('Pokémon') ? hpRange : null,
      // supertype: selectedSupertypes,
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
        <Text style={styles.selectAllText}>
          {allSelected ? `Deselect All ${label}` : `Select All ${label}`}
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
          label="Filters"
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
          <Pressable style={styles.sheet}>
            <BottomSheetHeader
              title="Filters"
              onClose={() => setVisible(false)}
              iconSize={24}
            />

            <ScrollView style={styles.optionsContainer}>
              {/* Rarity */}
              <FilterSectionToggle
                label={'Rarity'}
                expanded={expanded.rarity}
                onPress={() => toggleExpand('rarity')}
              />
              {expanded.rarity && (
                <View style={styles.sectionBlock}>
                  {renderSelectAllRow(
                    'Rarity',
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
                              styles.rarityChipText,
                              selected && { color: textColor },
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
              {/* Type */}
              <FilterSectionToggle
                label={'Energy Type'}
                expanded={expanded.type}
                onPress={() => toggleExpand('type')}
              />
              {expanded.type && (
                <View style={styles.sectionBlock}>
                  {renderSelectAllRow(
                    'Type',
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
              {/* Attack */}
              <FilterSectionToggle
                label={'Attack Cost Energy Type'}
                expanded={expanded.attack}
                onPress={() => toggleExpand('attack')}
              />
              {expanded.attack && (
                <View style={styles.sectionBlock}>
                  {renderSelectAllRow(
                    'Attack',
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
              {/* HP Range */}
              <FilterSectionToggle
                label={'HP Range'}
                expanded={expanded.hp}
                onPress={() => toggleExpand('hp')}
              />
              {expanded.hp && (
                <View style={styles.sectionBlock}>
                  <HPRangeSlider hpRange={hpRange} setHpRange={setHpRange} />
                </View>
              )}

              {/* Supertype
              <FilterSectionToggle
                label={'Card Supertype'}
                expanded={expanded.supertype}
                onPress={() => toggleExpand('supertype')}
              />
              {expanded.supertype && (
                <View style={styles.sectionBlock}>
                  <SupertypeOptions
                    selected={selectedSupertypes}
                    setSelected={setSelectedSupertypes}
                  />
                </View>
              )} */}

              {/* Regulation Mark */}
              <FilterSectionToggle
                label={'Regulation Mark'}
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
                label={'Card Legality'}
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
          </Pressable>
        </Pressable>
      </Modal>
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
    backgroundColor: '#FFFFFF',
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
  selectAllText: { fontSize: 14, fontWeight: '600' },
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
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 0,
  },
});
