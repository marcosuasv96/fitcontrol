import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Una sola instancia global para todo tu proyecto Next.js
export const supabase = createClient(supabaseUrl, supabaseAnonKey);