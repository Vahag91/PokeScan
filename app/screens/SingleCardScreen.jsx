import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
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
  LineChart,
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
import PremiumChartWrapper from '../components/PremiumChartWrapper';
import PaywallModal from './PaywallScreen';
import {
  fetchCardFromSupabase,
  fetchEvolutions,
  mergeCardWithPrice,
  fetchSeriesOptions,
  fetchPriceHistoryPoints,
} from '../../supabase/utils';
import { globalStyles } from '../../globalStyles';

const abilityIcon = require('../assets/icons/cardIcons/ability.png');

export default function SingleCardScreen() {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const { cardId, language = 'en' } = route.params;
  const { theme } = useContext(ThemeContext);

  const [cardData, setCardData] = useState(null);
  const [collectionsModalVisible, setCollectionsModalVisible] = useState(false);
  const [isInCollection, setIsInCollection] = useState(null);
  const [fromData, setFromData] = useState([]);
  const [toData, setToData] = useState([]);

  // chart state
  const [seriesList, setSeriesList] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [days, setDays] = useState(90);
  const [showPaywall, setShowPaywall] = useState(false);

  // active series object to pass into <LineChart />
  const activeSeries =
    seriesList.find((s) => s.series_key === selectedSeries) || null;

  const headerRightButton = useCallback(
    () => (
      <CollectionHeaderButton
        isInCollection={isInCollection}
        onPress={() => setCollectionsModalVisible(true)}
      />
    ),
    [isInCollection],
  );

  useEffect(() => {
    navigation.setOptions({ headerRight: headerRightButton });
  }, [headerRightButton, navigation]);

  useEffect(() => {
    if (!cardId) return;

    (async () => {
      const db = await getDBConnection();
      const ids = await getCollectionsForCard(db, cardId);
      setIsInCollection(ids.length > 0);

      let currentCard = null;
      let fromIds = [];
      let toIds = [];

      if (ids.length) {
        const cards = await getCardsByCollectionId(db, ids[0]);
        const match = cards.find((c) => c.cardId === cardId);
        if (match) {
          try {
            currentCard = normalizeCardFromDb(match);
            setCardData(currentCard);
          } catch (_) { }
        }
      }

      if (!currentCard) {
        const supabaseCard = await fetchCardFromSupabase(cardId, language);
        if (supabaseCard) {
          currentCard = supabaseCard?.normalized;
          setCardData(currentCard);
          fromIds = supabaseCard?.evolvesFrom || [];
          toIds = supabaseCard?.evolvesTo || [];
        } else {
          const fallback = defaultSearchCards.find((c) => c.id === cardId);
          if (fallback) {
            try {
              const cardWithPrices = await mergeCardWithPrice(fallback);
              currentCard = normalizeCardFromAPI(cardWithPrices);
              setCardData(currentCard);
            } catch (_) { }
          }
        }
      }

      if ((fromIds?.length || 0) > 0 || (toIds?.length || 0) > 0) {
        const { evolutionFrom, evolutionTo } = await fetchEvolutions(fromIds, toIds, language);
        setFromData(evolutionFrom || []);
        setToData(evolutionTo || []);
      } else {
        setFromData([]);
        setToData([]);
      }
    })();
  }, [cardId, language]);

  // Load series options + default points (use current `days`)
  useEffect(() => {
    if (!cardData?.id) return;

    (async () => {
      try {
        const options = await fetchSeriesOptions(cardData.id, days);
        setSeriesList(options);

        const key = options[0]?.series_key || null;
        setSelectedSeries(key);

        if (!key) {
          setChartData([]);
          return;
        }

        const { points } = await fetchPriceHistoryPoints(cardData.id, key, days);
        setChartData(points || []);
      } catch (e) {
        setChartData([]);
      }
    })();
  }, [cardData?.id, days]);

  // Refetch points when either series or days change (single source of truth)
  useEffect(() => {
    if (!cardData?.id || !selectedSeries) return;
    (async () => {
      try {
        const { points } = await fetchPriceHistoryPoints(cardData.id, selectedSeries, days);
        setChartData(points || []);
      } catch (e) {
        setChartData([]);
      }
    })();
  }, [cardData?.id, selectedSeries, days]);

  if (!cardData) return <SkeletonSingleCard />;

  const navigateTo = (id) =>
    navigation.push('SingleCardScreen', { cardId: id, language });

  const styles = getStyles(theme);

  return (
    <>
      <ScrollView style={styles.screen}>
        <EvolutionChain title={t('cards.evolvesFrom')} cards={fromData} onCardPress={navigateTo} />
        <EvolutionChain title={t('cards.evolvesTo')} cards={toData} onCardPress={navigateTo} />
        <CardSetHeader cardData={cardData} onPress={(setId) => navigation.navigate('SetDetail', { setId, language })} />
        <CardImageViewer imageSource={cardData.image} />

        <AnimatedSection style={styles.sectionCard}>
          <Text style={[globalStyles.subheading, styles.sectionTitle]}>{t('cards.marketOverview')}</Text>
          <MarketOverview tcgplayer={cardData.tcgplayer} cardmarket={cardData.cardmarket} />
        </AnimatedSection>

        {chartData && chartData.length > 0 && (
          <PremiumChartWrapper
            title={t('cards.charts.priceHistoryLocked')}
            subtitle={t('cards.charts.priceHistorySubtitle')}
            onUpgradePress={() => setShowPaywall(true)}
          >
            <LineChart
              data={chartData}
              series={activeSeries}
              days={days}
              onChangeDays={setDays}
            />
          </PremiumChartWrapper>
        )}

        {cardData.abilities?.length > 0 && (
          <AnimatedSection style={styles.sectionCard}>
            <Text style={[globalStyles.subheading, styles.sectionTitle]}>{t('cards.abilities')}</Text>
            {cardData.abilities.map((ab) => (
              <LabelRow
                key={ab.name}
                label={
                  <View style={styles.iconLabel}>
                    <Image source={abilityIcon} style={styles.abilityIcon} />
                    <Text style={[globalStyles.body, styles.labelText]}>{ab.name}</Text>
                  </View>
                }
                subtext={ab.text}
              />
            ))}
          </AnimatedSection>
        )}

        {cardData.attacks?.length > 0 && (
          <AnimatedSection style={styles.sectionCard}>
            <Text style={[globalStyles.subheading, styles.sectionTitle]}>{t('cards.attacks')}</Text>
            <LabelRow
              label={<LabelWithIcon types={[cardData.types?.[0]]} text={t('cards.hp')} />}
              value={cardData.hp || t('cards.unknown')}
            />
            {cardData.attacks.map((atk) => (
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
          <Text style={[globalStyles.subheading, styles.sectionTitle]}>{t('cards.details')}</Text>
          {cardData.types?.length > 0 && <LabelRow label={t('cards.types')} value={cardData.types.join(', ')} />}
          {cardData.subtypes?.[0] && <LabelRow label={t('cards.subtype')} value={cardData.subtypes[0]} />}
          <SetLabelRow set={cardData.set} />
          {cardData.artist && <LabelRow label={t('cards.illustrator')} value={cardData.artist} />}
          <LabelRow label={t('cards.number')} value={cardData.number} />
          <LabelRow
            label={t('cards.rarity')}
            value={
              <Text style={[globalStyles.body, styles.rarityText, { color: rarityColors[cardData.rarity] }]}>
                {cardData.rarity}
              </Text>
            }
          />
          <LabelRow label={t('cards.releaseYear')} value={cardData.set?.releaseDate} />
          <LabelRow label={t('cards.series')} value={cardData.set?.series} />
        </AnimatedSection>

        {cardData.flavorText && (
          <AnimatedSection style={styles.sectionCard}>
            <Text style={[globalStyles.caption, styles.flavorText]}>"{cardData.flavorText}"</Text>
          </AnimatedSection>
        )}

        <ExternalLinksSection cardData={cardData} theme={theme} />
      </ScrollView>

      <CardCollectionsModal
        visible={collectionsModalVisible}
        onClose={() => setCollectionsModalVisible(false)}
        card={cardData}
        onChange={async () => {
          // Refresh the collection status when modal closes
          const db = await getDBConnection();
          const ids = await getCollectionsForCard(db, cardId);
          setIsInCollection(ids.length > 0);
        }}
        language={language}
      />

      {/* 💰 Paywall Modal */}
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background, padding: 12 },
    sectionCard: { backgroundColor: theme.inputBackground, borderRadius: 12 },
    sectionTitle: { marginBottom: 12, color: theme.text },
    iconLabel: { flexDirection: 'row', alignItems: 'center' },
    abilityIcon: { width: 24, height: 24, marginRight: 6 },
    labelText: { color: theme.text },
    rarityText: { fontWeight: '600' },
    flavorText: { fontStyle: 'italic', color: theme.mutedText, textAlign: 'center', lineHeight: 20 },
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
