import { supabase } from './supabase';
import { normalizeCardFromAPI } from '../app/utils';
import { getDBConnection } from '../app/lib/db';
import { defaultSearchCards } from '../app/constants';


export async function fetchScannerCardFromSupabaseJPStrict(
  nameEN,            // string or null
  number,            // string or null (e.g., "038/063", "SV-P007")
  hp = null,         // number or string; coerced to number or null
  artist = null      // string or null
) {
  try {
    // Normalize inputs -> null if empty
    const p_name_en = nameEN && String(nameEN).trim() ? String(nameEN).trim() : null;
    const p_number  = number && String(number).trim() ? String(number).trim() : null;

    const hpNum = Number(hp);
    const p_hp = Number.isFinite(hpNum) ? hpNum : null;

    const p_artist = artist && String(artist).trim() ? String(artist).trim() : null;

    const { data, error } = await supabase.rpc('match_card_jp', {
      p_name_en,
      p_number,
      p_hp,
      p_artist,
    });

    if (error) {
      console.error('[match_card_jp] RPC error:', error, 'payload:', { p_name_en, p_number, p_hp, p_artist });
      return null;
    }

    if (!data || !data.length) return null;

    // The RPC already limits to 1 or (fallback) <= 3; keep it consistent
    return data.slice(0, 3);
  } catch (e) {
    console.error('[match_card_jp] thrown error:', e);
    return null;
  }
}

export async function matchCardENStrict({ name, number, hp, illustrator }) {
  // Normalize inputs for the RPC
  const p_name   = name ?? null;
  const p_number = (typeof number === 'string' && number.trim().length) ? number.trim() : null;
  const p_artist = illustrator ?? null;

  let p_hp = null;
  if (hp !== null && hp !== undefined) {
    const n = Number(hp);
    // Trainers sometimes come as 0 → treat as NULL so trainer tiers are used
    p_hp = Number.isFinite(n) && n > 0 ? n : null;
  }

  try {
    const payload = { p_name, p_number, p_hp, p_artist };
    
    const { data, error } = await supabase.rpc('match_card_en', payload);

    if (error) {
      console.error('[match_card_en] RPC error:', error, 'payload:', payload);
      return null;
    }
    return Array.isArray(data) && data.length ? data.slice(0, 3) : null;
  } catch (err) {
    console.error('[match_card_en] RPC exception:', err);
    return null;
  }
}
// export async function fetchScannerCardFromSupabaseJPStrict(

//   nameEN,            // English name from JP edge fn
//   number,            // e.g., "005/063" or "SV-P007"
//   hp = null,         // numeric or string
//   artist = null      // used for Tier A and trainer/supporter tier
// ) {
//   const hpNum = hp == null ? null : Number(hp);
//   const namePattern = buildNamePattern(nameEN);
//   const artistPattern = artist ? `%${escapeForILike(artist)}%` : null;
//   const numberCandidates = buildNumberCandidates(number);

//   async function run(q) {
//     const { data, error } = await q;
//     if (!error && data?.length) return [data[0]];
//     return null;
//   }

//   // Helper for the rescue tier to ensure uniqueness (return only if exactly 1 match)
//   async function runUnique(q) {
//     const { data, error } = await q;
//     if (error || !data) return null;
//     if (data.length === 1) return [data[0]];
//     return null; // not unique → don't guess
//   }

//   // ======== PATH 1: HP is provided (Pokémon) — keep your strict tiers ========
//   if (Number.isFinite(hpNum)) {
//     if (!namePattern) return null; // your rule: Name + HP must exist

//     // Tier A: name + hp + number + artist
//     if (artistPattern && numberCandidates.length > 0) {
//       const q = supabase
//         .from('cards_jp')
//         .select('*')
//         .ilike('name', namePattern)
//         .eq('hp', hpNum)
//         .in('number', numberCandidates)
//         .ilike('artist', artistPattern)
//         .limit(1);
//       const hit = await run(q);
//       if (hit) return hit;
//     }

//     // Tier B: name + hp + number
//     if (numberCandidates.length > 0) {
//       let q = supabase
//         .from('cards_jp')
//         .select('*')
//         .ilike('name', namePattern)
//         .eq('hp', hpNum)
//         .in('number', numberCandidates)
//         .limit(1);
//       let hit = await run(q);
//       if (hit) return hit;

//       // If original looked like NNN/NNN, try left prefix with strict name+hp
//       const frac = String(number || '').match(/^(\d{1,3})\/(\d{1,3})$/);
//       if (frac) {
//         const left = frac[1].replace(/^0+/, '') || '0';
//         q = supabase
//           .from('cards_jp')
//           .select('*')
//           .ilike('name', namePattern)
//           .eq('hp', hpNum)
//           .ilike('number', `${left}/%`)
//           .limit(1);
//         hit = await run(q);
//         if (hit) return hit;
//       }
//     }

//     // ── Tier H (HP-tolerant): name + number [+ artist], ignore hp ──
//     // Use this ONLY when number is present; it fixes cases where OCR misreads HP
//     if (numberCandidates.length > 0) {
//       // H1: name + number + artist (strongest)
//       if (artistPattern) {
//         const qH1 = supabase
//           .from('cards_jp')
//           .select('*')
//           .ilike('name', namePattern)
//           .in('number', numberCandidates)
//           .ilike('artist', artistPattern)
//           .limit(1);
//         const h1 = await run(qH1);
//         if (h1) return h1;
//       }
//       // H2: name + number (no artist)
//       {
//         const qH2 = supabase
//           .from('cards_jp')
//           .select('*')
//           .ilike('name', namePattern)
//           .in('number', numberCandidates)
//           .limit(1);
//         const h2 = await run(qH2);
//         if (h2) return h2;
//       }
//       // H3: if fraction, try left-prefix with name (±artist)
//       const frac = String(number || '').match(/^(\d{1,3})\/(\d{1,3})$/);
//       if (frac) {
//         const left = frac[1].replace(/^0+/, '') || '0';
//         if (artistPattern) {
//           const qH3a = supabase
//             .from('cards_jp')
//             .select('*')
//             .ilike('name', namePattern)
//             .ilike('number', `${left}/%`)
//             .ilike('artist', artistPattern)
//             .limit(1);
//           const h3a = await run(qH3a);
//           if (h3a) return h3a;
//         }
//         const qH3b = supabase
//           .from('cards_jp')
//           .select('*')
//           .ilike('name', namePattern)
//           .ilike('number', `${left}/%`)
//           .limit(1);
//         const h3b = await run(qH3b);
//         if (h3b) return h3b;
//       }
//     }

//     // ── Tier M (RESCUE): hp + number [+ artist], ignore name BUT only accept if unique ──
//     // (kept as-is; this will usually fail when hp is misread—which is why Tier H exists)
//     if (numberCandidates.length > 0) {
//       if (artistPattern) {
//         const q1 = supabase
//           .from('cards_jp')
//           .select('*')
//           .eq('hp', hpNum)
//           .in('number', numberCandidates)
//           .ilike('artist', artistPattern)
//           .limit(3); // check uniqueness
//         const unique1 = await runUnique(q1);
//         if (unique1) return unique1;
//       }

//       const q2 = supabase
//         .from('cards_jp')
//         .select('*')
//         .eq('hp', hpNum)
//         .in('number', numberCandidates)
//         .limit(3); // check uniqueness
//       const unique2 = await runUnique(q2);
//       if (unique2) return unique2;

//       const frac = String(number || '').match(/^(\d{1,3})\/(\d{1,3})$/);
//       if (frac) {
//         const left = frac[1].replace(/^0+/, '') || '0';

//         if (artistPattern) {
//           const q3a = supabase
//             .from('cards_jp')
//             .select('*')
//             .eq('hp', hpNum)
//             .ilike('number', `${left}/%`)
//             .ilike('artist', artistPattern)
//             .limit(3);
//           const unique3a = await runUnique(q3a);
//           if (unique3a) return unique3a;
//         }

//         const q3b = supabase
//           .from('cards_jp')
//           .select('*')
//           .eq('hp', hpNum)
//           .ilike('number', `${left}/%`)
//           .limit(3);
//         const unique3b = await runUnique(q3b);
//         if (unique3b) return unique3b;
//       }
//     }

//     // Tier C: name + hp
//     {
//       const q = supabase
//         .from('cards_jp')
//         .select('*')
//         .ilike('name', namePattern)
//         .eq('hp', hpNum)
//         .limit(1);
//       const hit = await run(q);
//       if (hit) return hit;
//     }

//     return null;
//   }

//   // ======== PATH 2: HP is null (Trainer/Supporter/Item/etc.) ========
//   if (artistPattern && numberCandidates.length > 0) {
//     // Tier TS-1: exact number + artist + hp IS NULL
//     let q = supabase
//       .from('cards_jp')
//       .select('*')
//       .is('hp', null)
//       .in('number', numberCandidates)
//       .ilike('artist', artistPattern)
//       .limit(1);
//     let hit = await run(q);
//     if (hit) return hit;

//     // Tier TS-2: if number is NNN/NNN, also try left prefix with hp IS NULL
//     const frac = String(number || '').match(/^(\d{1,3})\/(\d{1,3})$/);
//     if (frac) {
//       const left = frac[1].replace(/^0+/, '') || '0';
//       q = supabase
//         .from('cards_jp')
//         .select('*')
//         .is('hp', null)
//         .ilike('number', `${left}/%`)
//         .ilike('artist', artistPattern)
//         .limit(1);
//       hit = await run(q);
//       if (hit) return hit;
//     }
//   }

//   return null;
// }




// --- helpers ---

// === EN helper: keep Unicode (é) so ILIKE matches names like “Pokémon Catcher”






// export async function fetchScannerCardFromSupabase(
//   name,     // EN name from OCR/edge fn
//   number,   // e.g., "SVP033", "063/197", "TG02/TG30"
//   hp = null,
//   artist = null
// ) {
//   const hpNum = hp == null ? null : Number(hp);
//   const namePattern   = buildNamePatternENRelaxed(name); // Unicode-safe for EN
//   const artistPattern = artist ? `%${escapeForILike(artist)}%` : null;
//   const { leftNumbers, textCands, galleryPrefixes, leftPrefix, promoInfo } =
//     buildNumberBucketsEN(number);

//   async function first(q) {
//     const { data, error } = await q;
//     if (!error && data?.length) return [data[0]];
//     return null;
//   }
//   async function uniqueOnly(q) {
//     const { data, error } = await q;
//     if (error || !data) return null;
//     if (data.length === 1) return [data[0]];
//     return null;
//   }

//   // ===== PATH 1: Pokémon (hp present) — A → B → M → C =====
//   if (Number.isFinite(hpNum)) {
//     if (!namePattern) return null;

//     // Promo fast-lane (SVP/SWSH/SM/XY/BW/DP)
//     if (promoInfo?.setId) {
//       if (artistPattern) {
//         let q = supabase.from('cards').select('*')
//           .ilike('name', namePattern).eq('hp', hpNum)
//           .eq('number', promoInfo.numNumeric)
//           .contains('set', { setId: promoInfo.setId })
//           .ilike('artist', artistPattern).limit(1);
//         let hit = await first(q); if (hit) return hit;

//         q = supabase.from('cards').select('*')
//           .ilike('name', namePattern).eq('hp', hpNum)
//           .eq('number', promoInfo.code)
//           .ilike('artist', artistPattern).limit(1);
//         hit = await first(q); if (hit) return hit;
//       }
//       {
//         let q = supabase.from('cards').select('*')
//           .ilike('name', namePattern).eq('hp', hpNum)
//           .eq('number', promoInfo.numNumeric)
//           .contains('set', { setId: promoInfo.setId }).limit(1);
//         let hit = await first(q); if (hit) return hit;

//         q = supabase.from('cards').select('*')
//           .ilike('name', namePattern).eq('hp', hpNum)
//           .eq('number', promoInfo.code).limit(1);
//         hit = await first(q); if (hit) return hit;
//       }
//       {
//         let q = supabase.from('cards').select('*')
//           .eq('hp', hpNum)
//           .eq('number', promoInfo.numNumeric)
//           .contains('set', { setId: promoInfo.setId }).limit(2);
//         let u = await uniqueOnly(q); if (u) return u;

//         q = supabase.from('cards').select('*')
//           .eq('hp', hpNum)
//           .eq('number', promoInfo.code).limit(2);
//         u = await uniqueOnly(q); if (u) return u;
//       }
//     }

//     // Tier A: name + hp + number + artist
//     if (artistPattern && (leftNumbers.length || textCands.length)) {
//       if (leftNumbers.length) {
//         const q = supabase.from('cards').select('*')
//           .ilike('name', namePattern).eq('hp', hpNum)
//           .in('number', leftNumbers).ilike('artist', artistPattern).limit(1);
//         const hit = await first(q); if (hit) return hit;
//       }
//       if (textCands.length) {
//         const q = supabase.from('cards').select('*')
//           .ilike('name', namePattern).eq('hp', hpNum)
//           .in('number', textCands).ilike('artist', artistPattern).limit(1);
//         const hit = await first(q); if (hit) return hit;
//       }
//     }

//     // Tier B: name + hp + number
//     if (leftNumbers.length || textCands.length) {
//       if (leftNumbers.length) {
//         const q = supabase.from('cards').select('*')
//           .ilike('name', namePattern).eq('hp', hpNum)
//           .in('number', leftNumbers).limit(1);
//         const hit = await first(q); if (hit) return hit;
//       }
//       if (textCands.length) {
//         const q = supabase.from('cards').select('*')
//           .ilike('name', namePattern).eq('hp', hpNum)
//           .in('number', textCands).limit(1);
//         const hit = await first(q); if (hit) return hit;
//       }
//       if (galleryPrefixes?.length) {
//         for (const gp of galleryPrefixes) {
//           const q = supabase.from('cards').select('*')
//             .ilike('name', namePattern).eq('hp', hpNum)
//             .ilike('number', `${gp}/%`).limit(1);
//           const hit = await first(q); if (hit) return hit;
//         }
//       }
//       if (leftPrefix) {
//         const q = supabase.from('cards').select('*')
//           .ilike('name', namePattern).eq('hp', hpNum)
//           .ilike('number', `${leftPrefix}/%`).limit(1);
//         const hit = await first(q); if (hit) return hit;
//       }
//     }

//     // Tier M: rescue (ignore name), must be UNIQUE
//     if (leftNumbers.length || textCands.length) {
//       if (artistPattern) {
//         if (leftNumbers.length) {
//           const q1 = supabase.from('cards').select('*')
//             .eq('hp', hpNum).in('number', leftNumbers)
//             .ilike('artist', artistPattern).limit(3);
//           const u1 = await uniqueOnly(q1); if (u1) return u1;
//         }
//         if (textCands.length) {
//           const q1b = supabase.from('cards').select('*')
//             .eq('hp', hpNum).in('number', textCands)
//             .ilike('artist', artistPattern).limit(3);
//           const u1b = await uniqueOnly(q1b); if (u1b) return u1b;
//         }
//       }
//       if (leftNumbers.length) {
//         const q2 = supabase.from('cards').select('*')
//           .eq('hp', hpNum).in('number', leftNumbers).limit(3);
//         const u2 = await uniqueOnly(q2); if (u2) return u2;
//       }
//       if (textCands.length) {
//         const q2b = supabase.from('cards').select('*')
//           .eq('hp', hpNum).in('number', textCands).limit(3);
//         const u2b = await uniqueOnly(q2b); if (u2b) return u2b;
//       }
//       if (galleryPrefixes?.length) {
//         for (const gp of galleryPrefixes) {
//           const q3 = supabase.from('cards').select('*')
//             .eq('hp', hpNum).ilike('number', `${gp}/%`).limit(3);
//           const u3 = await uniqueOnly(q3); if (u3) return u3;
//         }
//       }
//       if (leftPrefix) {
//         const q4 = supabase.from('cards').select('*')
//           .eq('hp', hpNum).ilike('number', `${leftPrefix}/%`).limit(3);
//         const u4 = await uniqueOnly(q4); if (u4) return u4;
//       }
//     }

//     // Tier C: name + hp
//     {
//       const q = supabase.from('cards').select('*')
//         .ilike('name', namePattern).eq('hp', hpNum).limit(1);
//       const hit = await first(q); if (hit) return hit;
//     }

//     return null;
//   }

//   // ===== PATH 2: Trainer/Supporter/Item (hp null) =====

//   // 1) Number + artist (exact-ish text forms)
//   if (artistPattern && (leftNumbers.length || textCands.length || galleryPrefixes.length || leftPrefix)) {
//     if (textCands.length) {
//       const q = supabase.from('cards').select('*')
//         .is('hp', null).in('number', textCands)
//         .ilike('artist', artistPattern).limit(1);
//       const hit = await first(q); if (hit) return hit;
//     }
//     if (galleryPrefixes?.length) {
//       for (const gp of galleryPrefixes) {
//         const q = supabase.from('cards').select('*')
//           .is('hp', null).ilike('number', `${gp}/%`)
//           .ilike('artist', artistPattern).limit(1);
//         const hit = await first(q); if (hit) return hit;
//       }
//     }
//     if (leftPrefix) {
//       const q = supabase.from('cards').select('*')
//         .is('hp', null).ilike('number', `${leftPrefix}/%`)
//         .ilike('artist', artistPattern).limit(1);
//       const hit = await first(q); if (hit) return hit;
//     }
//   }

//   // 2) Ranked name fallback (handles reprints & diacritics like “Pokémon”)
//   if (namePattern) {
//     const { data, error } = await supabase.from('cards').select('*')
//       .is('hp', null).ilike('name', namePattern).limit(10);

//     if (!error && data?.length) {
//       const wantArtist = artist ? artist.toLowerCase() : null;

//       const scored = data
//         .map(c => {
//           const a = (c.artist || '').toLowerCase();
//           const setId = c.set?.setId || '';
//           const dateStr = c.set?.releaseDate || c.set?.updatedAt || '';
//           const ts = Date.parse(String(dateStr).replace(/\//g, '-')) || 0;

//           const scoreArtist = wantArtist && a.includes(wantArtist) ? 2 : 0;
//           const scoreSV     = /^sv/i.test(setId) ? 1 : 0;
//           const scoreDate   = ts / 1e13; // tiny tie-breaker
//           const score       = scoreArtist * 10 + scoreSV * 5 + scoreDate;

//           return { c, score };
//         })
//         .sort((x, y) => y.score - x.score)
//         .map(x => x.c);

//       if (scored.length === 1) return [scored[0]];
//       return scored.slice(0, 3);
//     }
//   }

//   return null;
// }



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

  const hoursSince = (ts) => {
    if (!ts) return Infinity;
    const iso = ts.includes('T') ? ts : ts.replace(' ', 'T') + 'Z';
    const t = Date.parse(iso);
    return Number.isNaN(t) ? Infinity : (Date.now() - t) / 36e5;
  };

  const fetchPrices = async (tableName, cardId) => {
    let lastErr;
    for (let attempt = 0; attempt < 2; attempt++) {
      const { data, error } = await supabase
        .from(tableName)
        .select('tcgplayer, cardmarket')
        .eq('id', cardId)
        .single();
      if (!error && data) return data;
      lastErr = error;
      await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
    }
    throw lastErr || new Error('Fetch failed');
  };

  try {
    const res = await db.executeSql(`
      SELECT DISTINCT cardId, LOWER(COALESCE(language,'en')) AS language
      FROM collection_cards
    `);
    const rows = res[0]?.rows || [];
    let updated = 0;

    for (let i = 0; i < rows.length; i++) {
      if (updated >= 50) break; // throttle
      const { cardId, language } = rows.item(i);
      if (!cardId) continue;
      const lang = (language === 'jp') ? 'jp' : 'en';

      try {
        // quick pre-check outside tx
        let fresh = false;
        try {
          const r0 = await db.executeSql(
            `SELECT updatedAt FROM card_prices WHERE cardId = ? LIMIT 1`,
            [cardId]
          );
          const row0 = r0[0]?.rows?.length ? r0[0].rows.item(0) : null;
          fresh = hoursSince(row0?.updatedAt) < 24;
        } catch {}

        if (fresh) continue;

        const tableName = lang === 'jp' ? 'cards_jp' : 'cards';
        const { tcgplayer, cardmarket } = await fetchPrices(tableName, cardId);
        const tcgJson = JSON.stringify(tcgplayer ?? null);
        const cmJson  = JSON.stringify(cardmarket ?? null);
        const nowIso  = new Date().toISOString();

        await db.executeSql('BEGIN IMMEDIATE');
        try {
          // re-check inside tx to close race
          const r1 = await db.executeSql(
            `SELECT updatedAt FROM card_prices WHERE cardId = ? LIMIT 1`,
            [cardId]
          );
          const row1 = r1[0]?.rows?.length ? r1[0].rows.item(0) : null;
          const stillStale = hoursSince(row1?.updatedAt) >= 24;

          if (stillStale) {
            await db.executeSql(
              `INSERT OR REPLACE INTO card_prices
               (cardId, tcgplayerPrices, cardmarketPrices, updatedAt)
               VALUES (?, ?, ?, ?)`,
              [cardId, tcgJson, cmJson, nowIso]
            );
            await db.executeSql(
              `UPDATE collection_cards
               SET tcgplayerPrices = ?, cardmarketPrices = ?
               WHERE cardId = ?`,
              [tcgJson, cmJson, cardId]
            );
            updated++;
          }

          await db.executeSql('COMMIT');
        } catch (txErr) {
          await db.executeSql('ROLLBACK');
          console.error('[prices][tx]', cardId, String(txErr?.message || txErr));
        }
      } catch (err) {
        console.error('[prices][card]', cardId, String(err?.message || err));
      }
    }
  } catch (err) {
    console.error('[prices] enumerate failed', String(err?.message || err));
  }
};




const DAY_MS = 24 * 60 * 60 * 1000;

export async function fetchSeriesOptions(cardId, days = 90) {
  const sinceIso = new Date(Date.now() - days * DAY_MS).toISOString();

  const { data, error } = await supabase
    .from('price_history_points')
    .select('series_key, series_label, bucket_end_at')
    .eq('card_id', cardId)
    .gte('bucket_end_at', sinceIso)
    .order('series_key', { ascending: true });

  if (error) throw error;

  const bySeries = new Map();
  for (const r of data || []) {
    const k = r.series_key;
    const label = r.series_label || k;
    const s = bySeries.get(k) || { series_key: k, series_label: label, count: 0 };
    s.count += 1;
    bySeries.set(k, s);
  }
  return [...bySeries.values()].sort((a, b) => b.count - a.count);
}

export async function fetchPriceHistoryPoints(cardId, seriesKey = null, days = 90) {
  const sinceIso = new Date(Date.now() - days * DAY_MS).toISOString();
  console.log('[fetchPriceHistoryPoints] start', { cardId, seriesKey, days, sinceIso });

  // pick default series if not provided
  let chosen = seriesKey;
  let seriesLabel = null;
  if (!chosen) {
    const options = await fetchSeriesOptions(cardId, days);
    console.log('[fetchPriceHistoryPoints] fetched series options', {
      cardId,
      days,
      optionCount: options.length,
      options,
    });
    if (!options.length) return { points: [], series_key: null, series_label: null };
    chosen = options[0].series_key;
    seriesLabel = options[0].series_label;
    console.log('[fetchPriceHistoryPoints] default series selected', { chosen, seriesLabel });
  } else {
    console.log('[fetchPriceHistoryPoints] using provided series', { chosen });
  }

  const { data, error } = await supabase
    .from('price_history_points')
    .select('bucket_end_at, value, series_label')
    .eq('card_id', cardId)
    .eq('series_key', chosen)
    .gte('bucket_end_at', sinceIso)
    .order('bucket_end_at', { ascending: true });

  if (error) {
    console.error('[fetchPriceHistoryPoints] query error', { cardId, chosen, days, error });
    throw error;
  }

  console.log('[fetchPriceHistoryPoints] raw data count', {
    cardId,
    chosen,
    days,
    count: data?.length ?? 0,
  });

  if (!seriesLabel) seriesLabel = data?.[0]?.series_label || chosen;

  const points = (data || []).map((r, i) => ({
    day: i + 1,
    highTmp: Number(r.value),
    date: r.bucket_end_at,
  }));

  console.log('[fetchPriceHistoryPoints] mapped points', {
    cardId,
    chosen,
    days,
    pointCount: points.length,
  });

  return { points, series_key: chosen, series_label: seriesLabel };
}
