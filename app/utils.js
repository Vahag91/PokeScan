import Ionicons from 'react-native-vector-icons/Ionicons';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
const SCAN_LIMIT = 2;
const STORAGE_KEY = 'daily_scan_data';



const getTodayKey = () => {
  const now = new Date();
  return now.toISOString().split('T')[0]; 
};
 const getScanData = async () => {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : { date: getTodayKey(), count: 0 };
};
 const incrementScanCount = async () => {
  const today = getTodayKey();
  let data = await getScanData();

  if (data.date !== today) {
    data = { date: today, count: 1 };
  } else {
    data.count += 1;
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data.count;
};
 const hasExceededLimit = async () => {
  const data = await getScanData();
  const today = getTodayKey();

  return data.date === today && data.count >= SCAN_LIMIT;
};

function getTabIcon(routeName, color, size) {
  let iconName = 'home-outline';

  if (routeName === 'Search') iconName = 'search-outline';
  else if (routeName === 'Collections') iconName = 'albums-outline';
  else if (routeName === 'Scan') iconName = 'camera-outline';
  else if (routeName === 'Helper') iconName = 'chatbubble-ellipses-outline';
  else if (routeName === 'History') iconName = 'time-outline';

  return <Ionicons name={iconName} size={size} color={color} />;
}

const categories = [
  { title: 'Destined Rivals' },
  { title: 'Journey Together' },
  { title: 'Prismatic Evolutions' },
  { title: 'Surging Sparks' },
];
function getPriceColor(label, value, tier) {
  if (!tier || !value || value === '–') return defaultColor;

  const num = parseFloat(value.replace('$', ''));
  const base =
    tier.mid ??
    tier.averageSellPrice ??
    tier.avg7 ??
    tier.avg30 ??
    tier.trendPrice;

  if (!base || isNaN(num)) return defaultColor;

  const cleanLabel = label.trim();
  switch (cleanLabel) {
    case 'Market Price':
    case 'Trend':
    case 'Price Trend':
      return num > base ? positiveColor : defaultColor;

    case 'Low Price':
      return negativeColor;

    case 'High Price':
    case '1D Avg':
      return warningColor;

    case 'Direct Low':
    case 'German Low':
    case 'Avg Sell':
    case 'Mid Price':
      return specialColor;

    default:
      return defaultColor;
  }
}

const defaultColor = { color: '#1E293B' }; // slate-800 (was #94A3B8)
const positiveColor = { color: '#16A34A' }; // green-600
const negativeColor = { color: '#2563EB' }; // blue-600
const warningColor = { color: '#D97706' }; // amber-600
const specialColor = { color: '#D946EF' }; // fuchsia-500
function getCardPrice(item) {
  const tcgPrices = item?.tcgplayer?.prices;
  if (tcgPrices) {
    const firstKey = Object.keys(tcgPrices)[0];
    const firstFoil = tcgPrices[firstKey];
    if (firstFoil?.market != null) {
      return firstFoil.market;
    }
  }

  const cmTrend = item?.cardmarket?.prices?.trendPrice;
  if (typeof cmTrend === 'number') return cmTrend;

  return null;
}
const getContrastColor = hex => {
  const rHex = hex.substring(1, 3);
  const gHex = hex.substring(3, 5);
  const bHex = hex.substring(5, 7);

  let r = parseInt(rHex, 16) / 255;
  let g = parseInt(gHex, 16) / 255;
  let b = parseInt(bHex, 16) / 255;

  r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  return luminance > 0.7 ? '#000' : '#fff';
};
function normalizeCardFromAPI(card) {
  return {
    id: card.id,
    name: card.name,
    hp: card.hp ?? null,
    rarity: card.rarity ?? null,
    types: card.types ?? [],
    subtypes: card.subtypes ?? [],
    abilities: card.abilities ?? [],
    attacks: card.attacks ?? [],
    image:
      card.images?.large && typeof card.images.large === 'number'
        ? card.images.large
        : typeof card.images?.large === 'string'
        ? card.images.large
        : null,
    artist: card.artist ?? null,
    number: card.number ?? null,
    set: {
      name: card.set?.name ?? null,
      series: card.set?.series ?? null,
      logo:
        typeof card.set?.images?.logo === 'number'
          ? card.set.images.logo
          : typeof card.set?.images?.logo === 'string'
          ? card.set.images.logo
          : null,
      releaseDate: card.set?.releaseDate ?? null,
      setId: card.set?.id ?? null,
    },
    tcgplayer: {
      url: card.tcgplayer?.url ?? null,
      prices: card.tcgplayer?.prices ?? {},
    },
    cardmarket: {
      url: card.cardmarket?.url ?? null,
      prices: card.cardmarket?.prices ?? {},
    },
  };
}
function normalizeCardFromDb(cardRow) {
  
  return {
    id: cardRow.cardId,
    name: cardRow.name,
    hp: cardRow.hp,
    rarity: cardRow.rarity,
    types: parseJsonSafe(cardRow.types),
    subtypes: parseJsonSafe(cardRow.subtypes),

    attacks: parseJsonSafe(cardRow.attacks),
    abilities: parseJsonSafe(cardRow.abilities),
    weaknesses: parseJsonSafe(cardRow.weaknesses),
    resistances: parseJsonSafe(cardRow.resistances),
    retreatCost: parseJsonSafe(cardRow.retreatCost),

    artist: cardRow.artist,
    flavorText: cardRow.flavorText ?? null,
    number: cardRow.number,

    set: {
      name: cardRow.setName,
      series: cardRow.seriesName,
      logo: getFullPath(cardRow.setLogo),
      releaseDate: cardRow.releaseDate,
      setId: cardRow.setId,
    },
    image: getFullPath(cardRow.imagePath),
    tcgplayer: {
      url: cardRow.tcgplayerUrl ?? null,
      prices: parseJsonSafe(cardRow.tcgplayerPrices, {}),
    },

    cardmarket: {
      url: cardRow.cardmarketUrl ?? null,
      prices: parseJsonSafe(cardRow.cardmarketPrices, {}),
    },
  };
}
function parseJsonSafe(value, fallback = []) {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (err) {
      return fallback;
    }
  }
  return value ?? fallback;
}
const getFullPath = filename =>
  filename ? `file://${RNFS.DocumentDirectoryPath}/${filename}` : null;

function formatFoilLabel(key) {
  if (!key) return '';
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^1stEdition/, '1st Edition')
    .replace(/^unlimited/, 'Unlimited')
    .replace(/^normal/, 'Normal')
    .replace(/^holofoil/, 'Holofoil')
    .replace(/^reverse Holofoil/, 'Reverse Holofoil')
    .replace(/^etched Holofoil/, 'Etched Holofoil')
    .replace(/^promo Holofoil/, 'Promo Holofoil');
}

export {
  getTabIcon,
  categories,
  getPriceColor,
  getCardPrice,
  getContrastColor,
  normalizeCardFromAPI,
  normalizeCardFromDb,
  getFullPath,
  formatFoilLabel,
  incrementScanCount,
  hasExceededLimit
};
