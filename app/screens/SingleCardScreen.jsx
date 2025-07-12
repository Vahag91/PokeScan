import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  Image,
  Linking,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import useSWR from 'swr';
import SkeletonSingleCard from '../components/skeletons/SkeletonSingleCard';
import { handleImageLoad } from '../utils';
import { rarityColors } from '../constants';
import {
  EvolutionChain,
  AnimatedSection,
  LabelRow,
  LabelWithIcon,
  FullImageModal,
  MarketOverview,
} from '../components/singleCardUi';
import { fetcher, normalizeCardFromAPI, normalizeCardFromDb } from '../utils';
import CardCollectionsModal from '../components/collections/CardCollectionsModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  getDBConnection,
  getCollectionsForCard,
  getCardsByCollectionId,
} from '../lib/db';

const abilityIcon = require('../assets/icons/cardIcons/ability.png');

export default function SingleCardScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { cardId } = route.params;

  const [cardData, setCardData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [collectionsModalVisible, setCollectionsModalVisible] = useState(false);
  const [isInCollection, setIsInCollection] = useState(false);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const imageScale = useRef(new Animated.Value(0.8)).current;

  const { data, error, isLoading } = useSWR(
    `https://api.pokemontcg.io/v2/cards/${cardId}`,
    fetcher,
  );

  const { data: fromData } = useSWR(
    cardData?.evolvesFrom
      ? `https://api.pokemontcg.io/v2/cards?q=name:${encodeURIComponent(
          cardData.evolvesFrom,
        )}`
      : null,
    fetcher,
  );

  const { data: toData } = useSWR(
    cardData?.evolvesTo?.length
      ? `https://api.pokemontcg.io/v2/cards?q=name:${encodeURIComponent(
          cardData.evolvesTo.join('|'),
        )}`
      : null,
    fetcher,
  );

  const loadCard = async () => {
    const db = await getDBConnection();
    const ids = await getCollectionsForCard(db, cardId);
    const isIn = ids.length > 0;
    setIsInCollection(isIn);

    if (isIn) {
      const cards = await getCardsByCollectionId(db, ids[0]);
      const match = cards.find(c => c.cardId === cardId);

      if (match) {
        try {
          const normalized = normalizeCardFromDb(match);
          setCardData(normalized);
          return;
        } catch (err) {
          console.log('❌ normalizeCardFromDb error:', err.message);
        }
      }
    }

    // If not in collection or fallback
    if (data?.data) {
      const normalized = normalizeCardFromAPI(data.data);
      setCardData(normalized);
    }
  };

  useEffect(() => {
    if (cardId) loadCard();
  }, [cardId, data]);

  if (!cardData) {
    if (isLoading) return <SkeletonSingleCard />;
    if (error)
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Failed to load card.</Text>
        </View>
      );
    return null;
  }

  const openImageModal = () => {
    setModalVisible(true);
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(imageScale, {
        toValue: 1,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const navigateTo = id => navigation.push('SingleCardScreen', { cardId: id });


  return (
    <>
      <ScrollView style={styles.screen}>
        <TouchableOpacity
          style={styles.collectionIcon}
          onPress={() => setCollectionsModalVisible(true)}
        >
          <Ionicons
            name={isInCollection ? 'heart' : 'heart-outline'}
            size={24}
            color={isInCollection ? '#e11d48' : '#888'}
          />
        </TouchableOpacity>

        <EvolutionChain
          title="Evolves From"
          cards={fromData?.data}
          onCardPress={navigateTo}
        />
        <EvolutionChain
          title="Evolves To"
          cards={toData?.data}
          onCardPress={navigateTo}
        />

        <AnimatedSection style={styles.headerCard}>
          <Text style={styles.cardName}>{cardData?.name}</Text>
          <View style={styles.setInfo}>
            {cardData?.set?.logo && (
              <Image
                source={{ uri: cardData?.set?.logo }}
                style={styles.setLogo}
                resizeMode="contain"
              />
            )}
            <Text style={styles.setName}>{cardData?.set?.name}</Text>
          </View>
        </AnimatedSection>

        <AnimatedSection style={styles.imageCard}>
          <TouchableOpacity onPress={openImageModal} activeOpacity={0.9}>
            <Animated.Image
              source={{ uri: cardData?.image }}
              style={styles.cardImage}
              onLoadEnd={handleImageLoad(backdropOpacity, imageScale)}
            />
          </TouchableOpacity>
        </AnimatedSection>

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
          <LabelRow label="Set" value={cardData.set?.name} />
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

      <FullImageModal
        cardImage={cardData?.image}
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        backdropOpacity={backdropOpacity}
        imageScale={imageScale}
      />

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
  collectionIcon: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 4,
      },
    }),
  },
  screen: { flex: 1, backgroundColor: '#eef2f5', padding: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#a00', fontSize: 16 },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  setInfo: { flexDirection: 'row', alignItems: 'center' },
  setLogo: { width: 80, height: 32 },
  setName: { fontSize: 16, color: '#555', marginLeft: 8, fontWeight: '500' },
  imageCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  cardImage: { width: '100%', height: 470, borderRadius: 12 },
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
