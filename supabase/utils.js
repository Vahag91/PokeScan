import { supabase } from './supabase';
import { normalizeCardFromAPI } from '../app/utils';
import { getDBConnection } from '../app/lib/db';
import { defaultSearchCards } from '../app/constants';



function pad3(n) {
  const s = String(n).trim();
  return s.padStart(3, '0');
}

function escapeForILike(s) {
  if (!s) return '';
  return String(s).replace(/[%_]/g, ch => `\\${ch}`).trim();
}

// Normalize JP promo numbers: SVP007 -> SV-P007, SM P33 -> SM-P033
function normalizeJPPromo(num) {
  if (!num) return null;
  let s = String(num).trim().toUpperCase().replace(/\s+/g, '');
  s = s.replace(/^(SVP)(\d{1,3})$/, (_, p, n) => `SV-P${pad3(n)}`);
  s = s.replace(/^(SP)(\d{1,3})$/,   (_, p, n) => `S-P${pad3(n)}`);
  s = s.replace(/^(SMP)(\d{1,3})$/,  (_, p, n) => `SM-P${pad3(n)}`);
  s = s.replace(/^(XYP)(\d{1,3})$/,  (_, p, n) => `XY-P${pad3(n)}`);
  s = s.replace(/^(BWP)(\d{1,3})$/,  (_, p, n) => `BW-P${pad3(n)}`);
  s = s.replace(/^(DPP)(\d{1,3})$/,  (_, p, n) => `DP-P${pad3(n)}`);
  s = s.replace(/^(SV-P)(\d{1,3})$/, (_, p, n) => `${p}${pad3(n)}`);
  s = s.replace(/^(S-P)(\d{1,3})$/,  (_, p, n) => `${p}${pad3(n)}`);
  s = s.replace(/^(SM-P)(\d{1,3})$/, (_, p, n) => `${p}${pad3(n)}`);
  s = s.replace(/^(XY-P)(\d{1,3})$/, (_, p, n) => `${p}${pad3(n)}`);
  s = s.replace(/^(BW-P)(\d{1,3})$/, (_, p, n) => `${p}${pad3(n)}`);
  s = s.replace(/^(DP-P)(\d{1,3})$/, (_, p, n) => `${p}${pad3(n)}`);
  return s;
}

// Return variations we will try for number equality
function buildNumberCandidates(numStr) {
  if (!numStr) return [];
  const s = String(numStr).trim();
  const arr = new Set();

  // Promo normalized
  const promo = normalizeJPPromo(s);
  if (promo && /^(?:SV-P|S-P|SM-P|XY-P|BW-P|DP-P)\d{3}$/.test(promo)) {
    arr.add(promo);
    return Array.from(arr);
  }

  // Fraction forms
  const m = s.match(/^(\d{1,3})\/(\d{1,3})$/);
  if (m) {
    const left = m[1].replace(/^0+/, '') || '0';
    const right = m[2].replace(/^0+/, '') || '0';
    const exact = `${m[1].padStart(3, '0')}/${m[2].padStart(3, '0')}`; // "005/063"
    const trimmed = `${left}/${right}`;                                // "5/63"
    arr.add(s);        // as-is
    arr.add(exact);
    arr.add(trimmed);
    // also try bare left variants ("5", "005") because some datasets store just left part
    arr.add(left);
    arr.add(pad3(left));
    return Array.from(arr);
  }

  // Bare numeric
  if (/^\d{1,3}$/.test(s)) {
    const bare = s.replace(/^0+/, '') || '0';
    arr.add(bare);
    arr.add(pad3(bare));
  }

  return Array.from(arr);
}

function buildNamePattern(nameEN) {
  if (!nameEN) return null;
  const cleaned = nameEN
    .toLowerCase()
    .replace(/’|‘|`/g, "'")
    .replace(/[^a-z0-9\s'\-\.]/g, '') // keep basic punctuation like apostrophe, dash, dot
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return null;
  return `%${escapeForILike(cleaned)}%`;
}

// ---------- main ----------
// --- helpers stay the same: pad3, escapeForILike, normalizeJPPromo, buildNumberCandidates, buildNamePattern ---

export async function fetchScannerCardFromSupabaseJPStrict(
  nameEN,            // English name from JP edge fn
  number,            // e.g., "005/063" or "SV-P007"
  hp = null,         // numeric or string
  artist = null      // used for Tier A and trainer/supporter tier
) {
  const hpNum = hp == null ? null : Number(hp);
  const namePattern = buildNamePattern(nameEN);
  const artistPattern = artist ? `%${escapeForILike(artist)}%` : null;
  const numberCandidates = buildNumberCandidates(number);

  async function run(q) {
    const { data, error } = await q;
    if (!error && data?.length) return [data[0]];
    return null;
  }

  // Helper for the rescue tier to ensure uniqueness (return only if exactly 1 match)
  async function runUnique(q) {
    const { data, error } = await q;
    if (error || !data) return null;
    if (data.length === 1) return [data[0]];
    return null; // not unique → don't guess
  }

  // ======== PATH 1: HP is provided (Pokémon) — keep your strict tiers ========
  if (Number.isFinite(hpNum)) {
    if (!namePattern) return null; // your rule: Name + HP must exist

    // Tier A: name + hp + number + artist
    if (artistPattern && numberCandidates.length > 0) {
      const q = supabase
        .from('cards_jp')
        .select('*')
        .ilike('name', namePattern)
        .eq('hp', hpNum)
        .in('number', numberCandidates)
        .ilike('artist', artistPattern)
        .limit(1);
      const hit = await run(q);
      console.log("Tier 111111",hit);
      
      if (hit) return hit;
    }

    // Tier B: name + hp + number
    if (numberCandidates.length > 0) {
      let q = supabase
        .from('cards_jp')
        .select('*')
        .ilike('name', namePattern)
        .eq('hp', hpNum)
        .in('number', numberCandidates)
        .limit(1);
      let hit = await run(q);
      console.log("Tier 222222",hit);
      if (hit) return hit;

      // If original looked like NNN/NNN, try left prefix with strict name+hp
      const frac = String(number || '').match(/^(\d{1,3})\/(\d{1,3})$/);
      if (frac) {
        const left = frac[1].replace(/^0+/, '') || '0';
        q = supabase
          .from('cards_jp')
          .select('*')
          .ilike('name', namePattern)
          .eq('hp', hpNum)
          .ilike('number', `${left}/%`)
          .limit(1);
        hit = await run(q);
        console.log("Tier 333333",hit);
        if (hit) return hit;
      }
    }

    // ── Tier M (RESCUE): hp + number [+ artist], ignore name BUT only accept if unique ──
    // Handles GPT misnaming when number & hp (and often artist) are correct.
    if (numberCandidates.length > 0) {
      // M1: number + hp + artist (unique)
      if (artistPattern) {
        const q1 = supabase
          .from('cards_jp')
          .select('*')
          .eq('hp', hpNum)
          .in('number', numberCandidates)
          .ilike('artist', artistPattern)
          .limit(3); // check uniqueness
        const unique1 = await runUnique(q1);
        console.log("Tier 444444",unique1);
        if (unique1) return unique1;
      }

      // M2: number + hp (unique)
      const q2 = supabase
        .from('cards_jp')
        .select('*')
        .eq('hp', hpNum)
        .in('number', numberCandidates)
        .limit(3); // check uniqueness
      const unique2 = await runUnique(q2);
      console.log("Tier 555555",unique2);
      if (unique2) return unique2;

      // M3: if input looked like NNN/NNN, try left prefix + hp (unique), with/without artist
      const frac = String(number || '').match(/^(\d{1,3})\/(\d{1,3})$/);
      if (frac) {
        const left = frac[1].replace(/^0+/, '') || '0';

        if (artistPattern) {
          const q3a = supabase
            .from('cards_jp')
            .select('*')
            .eq('hp', hpNum)
            .ilike('number', `${left}/%`)
            .ilike('artist', artistPattern)
            .limit(3);
          const unique3a = await runUnique(q3a);
          if (unique3a) return unique3a;
        }

        const q3b = supabase
          .from('cards_jp')
          .select('*')
          .eq('hp', hpNum)
          .ilike('number', `${left}/%`)
          .limit(3);
        const unique3b = await runUnique(q3b);
        if (unique3b) return unique3b;
      }
    }

    // Tier C: name + hp
    {
      const q = supabase
        .from('cards_jp')
        .select('*')
        .ilike('name', namePattern)
        .eq('hp', hpNum)
        .limit(1);
      const hit = await run(q);
      if (hit) return hit;
    }

    return null;
  }

  // ======== PATH 2: HP is null (Trainer/Supporter/Item/etc.) ========
  // Last tier, as requested: rely on number + artist; ignore name (can be wrong).
  // We also ensure hp IS NULL to avoid pulling Pokémon.
  if (artistPattern && numberCandidates.length > 0) {
    // Tier TS-1: exact number + artist + hp IS NULL
    let q = supabase
      .from('cards_jp')
      .select('*')
      .is('hp', null)
      .in('number', numberCandidates)
      .ilike('artist', artistPattern)
      .limit(1);
    let hit = await run(q);
    if (hit) return hit;

    // Tier TS-2: if number is NNN/NNN, also try left prefix with hp IS NULL
    const frac = String(number || '').match(/^(\d{1,3})\/(\d{1,3})$/);
    if (frac) {
      const left = frac[1].replace(/^0+/, '') || '0';
      q = supabase
        .from('cards_jp')
        .select('*')
        .is('hp', null)
        .ilike('number', `${left}/%`)
        .ilike('artist', artistPattern)
        .limit(1);
      hit = await run(q);
      if (hit) return hit;
    }
  }

  // Optional TS-3 fallback (if artist missing but number is very distinctive)
  // if (numberCandidates.length > 0) {
  //   const q = supabase.from('cards_jp')
  //     .select('*')
  //     .is('hp', null)
  //     .in('number', numberCandidates)
  //     .limit(1);
  //   const hit = await run(q);
  //   if (hit) return hit;
  // }

  return null;
}





export async function fetchCardFromSupabase(cardId, language = 'en') {
  try {
    // Select table based on language
    const table = language === 'jp' ? 'cards_jp' : 'cards';
    
    const { data, error } = await supabase
      .from(table)
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
// export async function searchCardsInSupabase(searchTerm = '') {
//   const cleaned = searchTerm.trim();
//   if (!cleaned) return [];

//   const escaped = cleaned.replace(/"/g, '\\"');
//   const pattern = `%${escaped}%`;

//   const { data, error } = await supabase
//     .from('cards_jp')
//     .select('*')
//     .or(
//       `name.ilike.${pattern},artist.ilike.${pattern},number.ilike.${pattern}`,
//     );

//   if (error) {
//     return [];
//   }

//   return data;
// }

export async function searchCardsUnified(searchTerm = '', { language = 'en', limit = 60 } = {}) {
  const cleaned = searchTerm.trim();
  if (!cleaned) return [];

  const escaped = cleaned.replace(/"/g, '\\"');
  const pattern = `%${escaped}%`;

  const queryCards = () =>
    supabase
      .from('cards')
      .select('*')
      .or(`name.ilike.${pattern},artist.ilike.${pattern},number.ilike.${pattern}`)

  const queryCardsJP = () =>
    supabase
      .from('cards_jp')
      .select('*')
      .or(`name.ilike.${pattern},artist.ilike.${pattern},number.ilike.${pattern}`)

  let responses = [];
  if (language === 'en') {
    responses = [await queryCards()];
  } else if (language === 'jp') {
    responses = [await queryCardsJP()];
  } else {
    // 'all'
    responses = await Promise.all([queryCards(), queryCardsJP()]);
  }

  const combined = [];
  for (const r of responses) {
    if (r.error) throw r.error;
    const rows = (r.data ?? []).map(row => ({
      ...row,
      language: row.language ?? (r === responses[0] && language !== 'jp' ? 'en' : 'jp'),
    }));
    combined.push(...rows);
  }

  // optional: quick de-dupe (ids should already be unique across tables)
  const seen = new Set();
  const unique = [];
  for (const c of combined) {
    const key = c.id ?? `${c.set?.id ?? ''}:${c.number ?? ''}:${c.language ?? ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(c);
    }
  }

  return unique;
}

export const fetchEvolutions = async (evolvesFrom, evolvesTo = [], language = 'en') => {
  let evolutionFrom = [];
  let evolutionTo = [];

  // Select table based on language
  const table = language === 'jp' ? 'cards_jp' : 'cards';

  try {
    if (evolvesFrom) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .ilike('name', evolvesFrom); // Or use `.eq()` for strict match

      if (error) throw error;
      evolutionFrom = data || [];
    }
    

    if (Array.isArray(evolvesTo) && evolvesTo.length > 0) {
      const { data, error } = await supabase
        .from(table)
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

      // Determine table based on card ID pattern or language field
      const cardLanguage = card.language?.toLowerCase() || 
                          (card.id?.startsWith('jp-') ? 'jp' : 'en');
      const tableName = cardLanguage === 'jp' ? 'cards_jp' : 'cards';

      const { data, error } = await supabase
        .from(tableName)
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
// Fetch English sets from en_sets table
export const fetchEnglishSets = async () => {
  try {
    const { data, error } = await supabase
      .from('en_sets')
      .select('*')
      .order('release_date', { ascending: false });

    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (err) {
    return [];
  }
};

// Fetch Japanese sets from jp_sets table
export const fetchJapaneseSets = async () => {
  try {
    const { data, error } = await supabase
      .from('jp_sets')
      .select('*')
      .order('release_date', { ascending: false });

    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (err) {
    return [];
  }
};

// Fetch cards for a specific English set
export const fetchEnglishSetCards = async (setId) => {
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .filter('set->>id', 'eq', setId);

    if (error) throw error;
    return data || [];
  } catch (err) {
    return [];
  }
};

// Fetch cards for a specific Japanese set
export const fetchJapaneseSetCards = async (setId) => {
  try {
    const { data, error } = await supabase
      .from('cards_jp')
      .select('*')
      .filter('set->>id', 'eq', setId);

    if (error) throw error;
    return data || [];
  } catch (err) {
    return [];
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

    // If no cached price, try to fetch from appropriate table based on card language
    const cardLanguage = card.language?.toLowerCase() || 'en';
    const tableName = cardLanguage === 'jp' ? 'cards_jp' : 'cards';
    
    const { data, error } = await supabase
      .from(tableName)
      .select('tcgplayer, cardmarket')
      .eq('id', card.id)
      .single();

    if (!error && data) {
      return {
        ...card,
        tcgplayer: data.tcgplayer,
        cardmarket: data.cardmarket,
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
    // Get cardId AND language for each unique card
    const result = await db.executeSql(`SELECT DISTINCT cardId, language FROM collection_cards`);
    const rows = result[0]?.rows || [];
    const count = rows.length;

    for (let i = 0; i < count; i++) {
      const cardId = rows.item(i).cardId;
      const cardLanguage = rows.item(i).language?.toLowerCase() || 'en';

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

        // 2. Select correct table based on language
        const tableName = cardLanguage === 'jp' ? 'cards_jp' : 'cards';
        
        // 3. Fetch fresh prices from Supabase with correct table
        const { data, error } = await supabase
          .from(tableName)
          .select('tcgplayer, cardmarket')
          .eq('id', cardId)
          .single();

        if (error || !data) {
          continue; // Skip this card if fetch failed
        }

        const tcgJson = JSON.stringify(data.tcgplayer);
        const cardmarketJson = JSON.stringify(data.cardmarket);

        // 4. Update card_prices table
        await db.executeSql(
          `INSERT OR REPLACE INTO card_prices
           (cardId, tcgplayerPrices, cardmarketPrices, updatedAt)
           VALUES (?, ?, ?, datetime('now'))`,
          [cardId, tcgJson, cardmarketJson]
        );

        // 5. Update prices in collection_cards for this cardId
        await db.executeSql(
          `UPDATE collection_cards
           SET tcgplayerPrices = ?, cardmarketPrices = ?
           WHERE cardId = ?`,
          [tcgJson, cardmarketJson, cardId]
        );
      } catch (err) {
        continue; // Skip this card on error
      }
    }
  } catch (err) {
    // Fail silently
  }
};
