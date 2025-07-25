import { supabase } from './supabase';
import { normalizeCardFromAPI } from '../app/utils';

export async function fetchCardFromSupabase(cardId) {
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .single();

    if (error) throw new Error(error.message);
    console.log(data, 'data from Supabase'); // Debugging line
    
    if (data) {
      return {
        normalized: normalizeCardFromAPI(data),
        evolvesFrom: data.evolvesfrom,
        evolvesTo: data.evolvesto,
      };
    }

    return null;
  } catch (err) {
    console.log('❌ Supabase fetch error:', err.message);
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
    .or(`name.ilike.${pattern},artist.ilike.${pattern},number.ilike.${pattern}`);

  if (error) {
    console.error('❌ Supabase search error:', error.message);
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
  } catch (err) {
    console.log('❌ Supabase evolution fetch error:', err.message);
  }

  return { evolutionFrom, evolutionTo };
};
export async function fetchScannerCardFromSupabase(name, number, hp = null, artist = null) {
  if (!name) return null;

const cleanedName = name
  .toLowerCase()
  .replace(/’|‘|`/g, "'")                  // normalize various apostrophes to single quote
  .replace(/[^a-z0-9\s']/g, '')            // allow letters, numbers, spaces, apostrophes
  .replace(/\s+/g, ' ')                    // normalize extra whitespace
  .trim();

  const pattern = `%${cleanedName}%`;
  console.log(name, "name");
  
  console.log(cleanedName, "cleanedName");
  
console.log(pattern, "pattern");

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
          c.artist?.toLowerCase().includes(artist.toLowerCase())
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
