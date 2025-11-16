import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Dataset {
  id: string;
  user_id: string;
  name: string;
  data: Record<string, any>[];
  columns: string[];
  row_count: number;
  created_at: string;
  updated_at: string;
}
