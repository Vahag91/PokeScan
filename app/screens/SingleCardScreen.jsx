import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import SkeletonSingleCard from '../components/skeletons/SkeletonSingleCard';
import { rarityColors } from '../constants';
import {
  EvolutionChain,
  AnimatedSection,
  LabelRow,
  LabelWithIcon,
  MarketOverview,
  SetLabelRow,
  CollectionHeaderButton,
  CardSetHeader,
  CardImageViewer,
  ExternalLinksSection,
} from '../components/singleCardUi';
import { normalizeCardFromAPI, normalizeCardFromDb } from '../utils';
import CardCollectionsModal from '../components/collections/CardCollectionsModal';
import {
  getDBConnection,
  getCollectionsForCard,
  getCardsByCollectionId,
} from '../lib/db';
import { defaultSearchCards } from '../constants';
import { ThemeContext } from '../context/ThemeContext';
import { fetchCardFromSupabase, fetchEvolutions } from '../../supabase/utils';
import { globalStyles } from '../../globalStyles';

const abilityIcon = require('../assets/icons/cardIcons/ability.png');

export default function SingleCardScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { cardId } = route.params;
  const { theme } = useContext(ThemeContext);

  const [cardData, setCardData] = useState(null);
  const [collectionsModalVisible, setCollectionsModalVisible] = useState(false);
  const [isInCollection, setIsInCollection] = useState(false);
  const [evolvesFrom, setEvolvesFrom] = useState([]);
  const [evolvesTo, setEvolvesTo] = useState([]);
  const [fromData, setFromData] = useState([]);
  const [toData, setToData] = useState([]);

  const headerRightButton = useCallback(
    () => (
      <CollectionHeaderButton
        isInCollection={isInCollection}
        onPress={() => setCollectionsModalVisible(true)}
      />
    ),
    [isInCollection],
  );

  const loadCard = async () => {
    const db = await getDBConnection();
    const ids = await getCollectionsForCard(db, cardId);
    const isIn = ids.length > 0;
    setIsInCollection(isIn);

    let localCard = null;

    if (isIn) {
      const cards = await getCardsByCollectionId(db, ids[0]);
      const match = cards.find(c => c.cardId === cardId);

      if (match) {
        try {
          localCard = normalizeCardFromDb(match);
          setCardData(localCard);
          return;
        } catch (err) {
          console.log('❌ normalizeCardFromDb error:', err.message);
        }
      }
    }

    const supabaseCard = await fetchCardFromSupabase(cardId);
    if (supabaseCard) {
      setCardData(supabaseCard.normalized);
      setEvolvesFrom(supabaseCard.evolvesFrom);
      setEvolvesTo(supabaseCard.evolvesTo);
      return;
    }

    const fallback = defaultSearchCards.find(c => c.id === cardId);
    if (fallback) {
      try {
        setCardData(normalizeCardFromAPI(fallback));
      } catch (err) {
        console.log('❌ normalize fallback error:', err.message);
      }
    }
  };

  useEffect(() => {
    if (cardId) loadCard();
  }, [cardId]);

  useEffect(() => {
    navigation.setOptions({ headerRight: headerRightButton });
  }, [headerRightButton, navigation]);

  useEffect(() => {
    const getEvolutions = async () => {
      if (!cardData) return;
      const { evolutionFrom, evolutionTo } = await fetchEvolutions(
        evolvesFrom,
        evolvesTo,
      );
      setFromData(evolutionFrom);
      setToData(evolutionTo);
    };
    getEvolutions();
  }, [cardData]);

  if (!cardData) return <SkeletonSingleCard />;

  const navigateTo = id => navigation.push('SingleCardScreen', { cardId: id });

  const styles = getStyles(theme);

  return (
    <>
      <ScrollView style={styles.screen}>
        <EvolutionChain
          title="Evolves From"
          cards={fromData}
          onCardPress={navigateTo}
        />
        <EvolutionChain
          title="Evolves To"
          cards={toData}
          onCardPress={navigateTo}
        />
        <CardSetHeader
          cardData={cardData}
          onPress={setId => navigation.navigate('SetDetail', { setId })}
        />
        <CardImageViewer imageSource={cardData.image} />

        <AnimatedSection style={styles.sectionCard}>
          <Text style={[globalStyles.subheading, styles.sectionTitle]}>
            Market Overview
          </Text>
          <MarketOverview
            tcgplayer={cardData.tcgplayer}
            cardmarket={cardData.cardmarket}
          />
        </AnimatedSection>

        {cardData.abilities?.length > 0 && (
          <AnimatedSection style={styles.sectionCard}>
            <Text style={[globalStyles.subheading, styles.sectionTitle]}>
              Abilities
            </Text>
            {cardData.abilities.map(ab => (
              <LabelRow
                key={ab.name}
                label={
                  <View style={styles.iconLabel}>
                    <Image source={abilityIcon} style={styles.abilityIcon} />
                    <Text style={[globalStyles.body, styles.labelText]}>
                      {ab.name}
                    </Text>
                  </View>
                }
                subtext={ab.text}
              />
            ))}
          </AnimatedSection>
        )}

        {cardData.attacks?.length > 0 && (
          <AnimatedSection style={styles.sectionCard}>
            <Text style={[globalStyles.subheading, styles.sectionTitle]}>
              Attacks
            </Text>
            <LabelRow
              label={<LabelWithIcon types={[cardData.types?.[0]]} text="HP" />}
              value={cardData.hp || 'N/A'}
            />
            {cardData.attacks.map(atk => (
              <LabelRow
                key={atk.name}
                label={<LabelWithIcon types={atk.cost} text={atk.name} />}
                value={atk.damage}
                subtext={atk.text}
              />
            ))}
          </AnimatedSection>
        )}

        <AnimatedSection style={styles.sectionCard}>
          <Text style={[globalStyles.subheading, styles.sectionTitle]}>
            Details
          </Text>
          {cardData.types?.length > 0 && (
            <LabelRow label="Types" value={cardData.types.join(', ')} />
          )}
          {cardData.subtypes?.[0] && (
            <LabelRow label="Subtype" value={cardData.subtypes[0]} />
          )}
          <SetLabelRow set={cardData.set} />
          {cardData.artist && (
            <LabelRow label="Illustrator" value={cardData.artist} />
          )}
          <LabelRow label="Number" value={cardData.number} />
          <LabelRow
            label="Rarity"
            value={
              <Text
                style={[
                  globalStyles.body,
                  styles.rarityText,
                  { color: rarityColors[cardData.rarity] },
                ]}
              >
                {cardData.rarity}
              </Text>
            }
          />
          <LabelRow label="Release Year" value={cardData.set?.releaseDate} />
          <LabelRow label="Series" value={cardData.set?.series} />
        </AnimatedSection>

        {cardData.flavorText && (
          <AnimatedSection style={styles.sectionCard}>
            <Text style={[globalStyles.caption, styles.flavorText]}>
              "{cardData.flavorText}"
            </Text>
          </AnimatedSection>
        )}
        <ExternalLinksSection cardData={cardData} theme={theme} />
      </ScrollView>

      <CardCollectionsModal
        visible={collectionsModalVisible}
        onClose={() => setCollectionsModalVisible(false)}
        card={cardData}
        onChange={loadCard}
      />
    </>
  );
}

const getStyles = theme =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background, padding: 12 },
    sectionCard: {
      backgroundColor: theme.inputBackground,
      borderRadius: 12,
    },
    sectionTitle: {
      marginBottom: 12,
      color: theme.text,
    },
    iconLabel: { flexDirection: 'row', alignItems: 'center' },
    abilityIcon: { width: 24, height: 24, marginRight: 6 },
    labelText: { color: theme.text },
    rarityText: { fontWeight: '600' },
    flavorText: {
      fontStyle: 'italic',
      color: theme.mutedText,
      textAlign: 'center',
      lineHeight: 20,
    },
    linkButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: theme.inputBackground,
      marginBottom: 8,
      alignItems: 'center',
    },
    linkButtonText: { color: theme.secondaryText, fontWeight: '600' },
  });
