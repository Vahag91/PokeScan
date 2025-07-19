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
