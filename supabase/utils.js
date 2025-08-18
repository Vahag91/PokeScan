import { supabase } from './supabase';
import { normalizeCardFromAPI } from '../app/utils';
import { getDBConnection } from '../app/lib/db';
import { defaultSearchCards } from '../app/constants';

export async function fetchCardFromSupabase(cardId) {
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .single();

    if (error) throw new Error(error.message);

    if (data) {
      return {
        normalized: normalizeCardFromAPI(data),
        evolvesFrom: data.evolvesfrom,
        evolvesTo: data.evolvesto,
      };
    }

    return null;
  } catch (err) {
    return null;
  }
}
export async function searchCardsInSupabase(searchTerm = '') {
  const cleaned = searchTerm.trim();
  if (!cleaned) return [];

  const escaped = cleaned.replace(/"/g, '\\"');
  const pattern = `%${escaped}%`;

  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .or(
      `name.ilike.${pattern},artist.ilike.${pattern},number.ilike.${pattern}`,
    );

  if (error) {
    return [];
  }

  return data;
}
export const fetchEvolutions = async (evolvesFrom, evolvesTo = []) => {
  let evolutionFrom = [];
  let evolutionTo = [];

  try {
    if (evolvesFrom) {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .ilike('name', evolvesFrom); // Or use `.eq()` for strict match

      if (error) throw error;
      evolutionFrom = data || [];
    }
    

    if (Array.isArray(evolvesTo) && evolvesTo.length > 0) {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .in('name', evolvesTo);

      if (error) throw error;
      evolutionTo = data || [];
    }
  } catch (_) {
  }

  return { evolutionFrom, evolutionTo };
};
export async function fetchScannerCardFromSupabase(
  name,
  number,
  hp = null,
  artist = null,
) {
  if (!name) return null;

  const cleanedName = name
    .toLowerCase()
    .replace(/’|‘|`/g, "'") // normalize various apostrophes to single quote
    .replace(/[^a-z0-9\s']/g, '') // allow letters, numbers, spaces, apostrophes
    .replace(/\s+/g, ' ') // normalize extra whitespace
    .trim();

  const pattern = `%${cleanedName}%`;

  let extractedNumber = null;
  if (number?.includes('/')) {
    extractedNumber = number.split('/')[0]?.replace(/^0+/, '');
  } else {
    extractedNumber = number?.replace(/^0+/, '');
  }

  // 1. Match: name + number
  if (extractedNumber) {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .ilike('name', pattern)
      .eq('number', extractedNumber);

    if (!error && data?.length) return data.slice(0, 3);
  }

  // 2. Match: name + hp + artist
  if (hp != null) {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .ilike('name', pattern)
      .eq('hp', hp);

    if (!error && data?.length) {
      if (artist) {
        const matches = data.filter(c =>
          c.artist?.toLowerCase().includes(artist.toLowerCase()),
        );
        if (matches.length) return matches.slice(0, 3);
      }
      return data.slice(0, 3); // fallback if artist doesn't match
    }
  }

  // 3. Match: name only
  const { data: looseData, error: looseError } = await supabase
    .from('cards')
    .select('*')
    .ilike('name', pattern)
    .limit(3);

  if (!looseError && looseData?.length) return looseData;

  return null;
}
export const updateDefaultCardPrices = async () => {
  const db = await getDBConnection();

  for (const card of defaultSearchCards) {
    try {
      const res = await db.executeSql(
        `SELECT updatedAt FROM card_prices WHERE cardId = ? LIMIT 1`,
        [card.id],
      );
      const row = res[0]?.rows?.length ? res[0].rows.item(0) : null;

      if (row?.updatedAt) {
        const lastUpdated = new Date(row.updatedAt).getTime();
        const now = Date.now();
        const hoursSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60);
        if (hoursSinceUpdate < 24) {
          continue;
        }
      }
      const { data, error } = await supabase
        .from('cards')
        .select('tcgplayer, cardmarket')
        .eq('id', card.id)
        .single();

      if (error || !data) {
        continue;
      }
      await db.executeSql(
        `INSERT OR REPLACE INTO card_prices
         (cardId, tcgplayerPrices, cardmarketPrices, updatedAt)
         VALUES (?, ?, ?, datetime('now'))`,
        [
          card.id,
          JSON.stringify(data.tcgplayer),
          JSON.stringify(data.cardmarket),
        ],
      );
    } catch (err) {
      continue;
    }
  }
};
export const mergeCardWithPrice = async card => {
  try {
    const db = await getDBConnection();
    const results = await db.executeSql(
      `SELECT * FROM card_prices WHERE cardId = ? LIMIT 1`,
      [card.id],
    );

    if (results[0]?.rows.length > 0) {
      const row = results[0].rows.item(0);
      return {
        ...card,
        tcgplayer: JSON.parse(row.tcgplayerPrices),
        cardmarket: JSON.parse(row.cardmarketPrices),
      };
    }
    return card;
  } catch (err) {
    return card;
  }
};

export const updateCollectionCardPrices = async () => {
  const db = await getDBConnection();

  try {
    const result = await db.executeSql(`SELECT DISTINCT cardId FROM collection_cards`);
    const rows = result[0]?.rows || [];
    const count = rows.length;

    for (let i = 0; i < count; i++) {
      const cardId = rows.item(i).cardId;

      try {
        // 1. Check cache in card_prices
        const res = await db.executeSql(
          `SELECT updatedAt FROM card_prices WHERE cardId = ? LIMIT 1`,
          [cardId]
        );
        const row = res[0]?.rows?.length ? res[0].rows.item(0) : null;

        if (row?.updatedAt) {
          const lastUpdated = new Date(row.updatedAt).getTime();
          const now = Date.now();
          const hoursSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60);

          if (hoursSinceUpdate < 24) {
            continue; // Skip if recently updated
          }
        }

        // 2. Fetch fresh prices from Supabase
        const { data, error } = await supabase
          .from('cards')
          .select('tcgplayer, cardmarket')
          .eq('id', cardId)
          .single();

        if (error || !data) {
          continue; // Skip this card if fetch failed
        }

        const tcgJson = JSON.stringify(data.tcgplayer);
        const cardmarketJson = JSON.stringify(data.cardmarket);

        // 3. Update card_prices table
        await db.executeSql(
          `INSERT OR REPLACE INTO card_prices
           (cardId, tcgplayerPrices, cardmarketPrices, updatedAt)
           VALUES (?, ?, ?, datetime('now'))`,
          [cardId, tcgJson, cardmarketJson]
        );

        // 4. Update prices in collection_cards for this cardId
        await db.executeSql(
          `UPDATE collection_cards
           SET tcgplayerPrices = ?, cardmarketPrices = ?
           WHERE cardId = ?`,
          [tcgJson, cardmarketJson, cardId]
        );
      } catch (err) {
        // Optionally log error to crash tool like Sentry
        continue; // Skip this card on error
      }
    }
  } catch (err) {
    // Fail silently or log globally
  }
};
