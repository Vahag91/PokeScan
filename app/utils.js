import Ionicons from 'react-native-vector-icons/Ionicons';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
const SCAN_LIMIT = 3;
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

const getRemainingFreeAttempts = async () => {
  const data = await getScanData();
  const today = getTodayKey();
  
  if (data.date !== today) {
    return SCAN_LIMIT;
  }
  
  return Math.max(0, SCAN_LIMIT - data.count);
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

  const cleanLabel = label.trim().toLowerCase();
  
  // Check for market price / trend patterns (works with any language)
  if (cleanLabel.includes('market') || cleanLabel.includes('trend') || cleanLabel.includes('marché') || cleanLabel.includes('mercado') || cleanLabel.includes('markt') || cleanLabel.includes('mercato') || cleanLabel.includes('tendencia') || cleanLabel.includes('tendenza') || cleanLabel.includes('tendance') || cleanLabel.includes('マーケット') || cleanLabel.includes('トレンド')) {
    return num > base ? positiveColor : defaultColor;
  }

  // Check for low price patterns (works with any language)
  if (cleanLabel.includes('low') || cleanLabel.includes('minimum') || cleanLabel.includes('minimo') || cleanLabel.includes('niedrig') || cleanLabel.includes('bas') || cleanLabel.includes('laagste') || cleanLabel.includes('最低') || cleanLabel.includes('direct') || cleanLabel.includes('direkt') || cleanLabel.includes('直販') || cleanLabel.includes('ドイツ') || cleanLabel.includes('min.')) {
    return negativeColor;
  }

  // Check for high price patterns (works with any language)
  if (cleanLabel.includes('high') || cleanLabel.includes('maximum') || cleanLabel.includes('massimo') || cleanLabel.includes('höchst') || cleanLabel.includes('haut') || cleanLabel.includes('hoogste') || cleanLabel.includes('最高') || cleanLabel.includes('max.')) {
    return warningColor;
  }

  // Check for special price types (mid, direct, german, avg, sell, suggested)
  if (cleanLabel.includes('mid') || 
      cleanLabel.includes('moyen') ||
      cleanLabel.includes('medio') ||
      cleanLabel.includes('中間') ||
      cleanLabel.includes('avg') || 
      cleanLabel.includes('sell') ||
      cleanLabel.includes('vente') ||
      cleanLabel.includes('vendita') ||
      cleanLabel.includes('verkoop') ||
      cleanLabel.includes('venda') ||
      cleanLabel.includes('平均') ||
      cleanLabel.includes('売却') ||
      cleanLabel.includes('suggested') ||
      cleanLabel.includes('sugerido') ||
      cleanLabel.includes('suggéré') ||
      cleanLabel.includes('empfohlen') ||
      cleanLabel.includes('consigliato') ||
      cleanLabel.includes('aanbevolen') ||
      cleanLabel.includes('推奨') ||
      cleanLabel.includes('german') ||
      cleanLabel.includes('deutsch') ||
      cleanLabel.includes('alemania') ||
      cleanLabel.includes('allemagne') ||
      cleanLabel.includes('germania') ||
      cleanLabel.includes('duits') ||
      cleanLabel.includes('alemanha') ||
      cleanLabel.includes('médio') ||
      cleanLabel.includes('gemiddeld') ||
      cleanLabel.includes('mittel')) {
    return specialColor;
  }

  return defaultColor;
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
  
  // Convert all the specific foil types to "Normal"
  const normalFoils = [
    'nonolo',
    'mirroreverseolo',
    'promo',
    'holo',
    'normalinderace',
    'normalikachu',
    'mirageolo',
    'normalewtwo',
    'normalyranitar',
    'normalaichu',
    'normalharizard',
    'normaloloaichu',
    'normaloloewtwo',
    'normalewtwo16',
    'normaloloharizard',
    'normaloloikachu',
    'unpeeledardidoof',
    'unpeeledardpinarak',
    'unpeeledardumel'
  ];
  
  // If the key matches any of the normal foils, return "Normal"
  if (normalFoils.includes(key)) {
    return 'Normal';
  }
  
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^1stEdition/, '1st Edition')
    .replace(/^unlimited/, 'Unlimited')
    .replace(/^normal/, 'Normal')
    .replace(/^holofoil/, 'Holofoil')
    .replace(/^reverse Holofoil/, 'Reverse Holofoil')
    .replace(/^etched Holofoil/, 'Etched Holofoil')
    .replace(/^promo Holofoil/, 'Promo Holofoil')
    .replace(/^pokallolo/, 'Poke Ball Holo')
    .replace(/^reverseolo/, 'Reverse Holofoil')
    .replace(/^masterallolo/, 'Master Ball Holo');
}

export const DATA = Array.from({ length: 31 }, (_, i) => ({
  day: i,
  highTmp: 40 + 30 * Math.random(),
}));

export const DATA2 = Array.from({ length: 31 }, (_, i) => ({
  day: i,
  highTmp: 40 + 10 * Math.random(),
}));
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
  hasExceededLimit,
  getRemainingFreeAttempts,
};
