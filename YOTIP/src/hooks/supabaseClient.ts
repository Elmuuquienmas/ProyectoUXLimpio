import { createClient } from '@supabase/supabase-js'

// Asegúrate de que estas variables existan en tu archivo .env
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("🚨 ERROR CRÍTICO: Faltan las variables de entorno de Supabase (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY). Verifica tu configuración en Vercel.")
} else if (!supabaseUrl.startsWith('http')) {
    // Corrección automática: Agregar https:// si falta
    supabaseUrl = `https://${supabaseUrl}`
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')