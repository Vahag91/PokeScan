import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  Linking,
  TouchableOpacity,
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
} from '../components/singleCardUi';
import { normalizeCardFromAPI, normalizeCardFromDb } from '../utils';
import CardCollectionsModal from '../components/collections/CardCollectionsModal';
import {
  getDBConnection,
  getCollectionsForCard,
  getCardsByCollectionId,
} from '../lib/db';
import { defaultSearchCards } from '../constants';
const abilityIcon = require('../assets/icons/cardIcons/ability.png');
import { fetchCardFromSupabase, fetchEvolutions } from '../../supabase/utils';

export default function SingleCardScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { cardId } = route.params;

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

  useEffect(() => {
    if (cardId) loadCard();
  }, [cardId]);

  useEffect(() => {
    navigation.setOptions({ headerRight: headerRightButton });
  }, [headerRightButton, navigation]);

  if (!cardData) return <SkeletonSingleCard />;

  const navigateTo = id => navigation.push('SingleCardScreen', { cardId: id });
console.log(cardData,"dataaa");

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
        <CardSetHeader cardData={cardData} />
        <CardImageViewer imageSource={cardData.image} />
        <AnimatedSection style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Market Overview</Text>
          <MarketOverview
            tcgplayer={cardData.tcgplayer}
            cardmarket={cardData.cardmarket}
          />
        </AnimatedSection>

        {cardData.abilities?.length > 0 && (
          <AnimatedSection style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Abilities</Text>
            {cardData.abilities.map(ab => (
              <LabelRow
                key={ab.name}
                label={
                  <View style={styles.iconLabel}>
                    <Image source={abilityIcon} style={styles.abilityIcon} />
                    <Text style={styles.labelText}>{ab.name}</Text>
                  </View>
                }
                subtext={ab.text}
              />
            ))}
          </AnimatedSection>
        )}

        {cardData.attacks?.length > 0 && (
          <AnimatedSection style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Attacks</Text>
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
          <Text style={styles.sectionTitle}>Details</Text>
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
            <Text style={styles.flavorText}>{`"${cardData.flavorText}"`}</Text>
          </AnimatedSection>
        )}

        <AnimatedSection style={styles.sectionCard}>
          {cardData.tcgplayer?.url && (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => Linking.openURL(cardData.tcgplayer.url)}
            >
              <Text style={styles.linkButtonText}>View on TCGPlayer</Text>
            </TouchableOpacity>
          )}
          {cardData.cardmarket?.url && (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => Linking.openURL(cardData.cardmarket.url)}
            >
              <Text style={styles.linkButtonText}>View on Cardmarket</Text>
            </TouchableOpacity>
          )}
        </AnimatedSection>
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#eef2f5', padding: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#a00', fontSize: 16 },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 12,
  },
  iconLabel: { flexDirection: 'row', alignItems: 'center' },
  abilityIcon: { width: 24, height: 24, marginRight: 6 },
  labelText: { fontSize: 16, color: '#444', fontWeight: '500' },
  rarityText: { fontSize: 16, fontWeight: '600' },
  flavorText: {
    fontStyle: 'italic',
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  linkButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#e1f5fe',
    marginBottom: 8,
    alignItems: 'center',
  },
  linkButtonText: { color: '#0277bd', fontWeight: '600' },
});
