import { createClient } from '@supabase/supabase-js';
import { SUPABASE_KEY } from '@env';

const supabaseUrl = 'https://orvklxcroobcnwzgiank.supabase.co';
const supabaseKey = SUPABASE_KEY;

if (!supabaseKey) {
  console.warn('❌ Supabase key missing (SUPABASE_KEY)');
}

export const supabase = createClient(supabaseUrl, supabaseKey ?? '');
