import { createClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseUrl = rawUrl;
let supabaseAnonKey = rawKey;

if (supabaseUrl && supabaseAnonKey) {
    supabaseUrl = supabaseUrl.trim().replace(/^["']|["']$/g, '');
    supabaseAnonKey = supabaseAnonKey.trim().replace(/^["']|["']$/g, '');

    if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
        supabaseUrl = `https://${supabaseUrl}`;
    }
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')