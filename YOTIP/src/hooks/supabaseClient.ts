import { createClient } from '@supabase/supabase-js'

// Asegúrate de que estas variables existan en tu archivo .env
const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("🔍 [DEBUG] Inicializando Supabase...");
console.log("🔍 [DEBUG] URL Leída:", rawUrl ? `'${rawUrl}'` : 'UNDEFINED');
console.log("🔍 [DEBUG] Key Leída:", rawKey ? 'PRESENTE (Oculta)' : 'FALTA');

let supabaseUrl = rawUrl;
const supabaseAnonKey = rawKey;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("🚨 [ERROR] Faltan variables de entorno. LA APP NO FUNCIONARÁ.");
} else {
    // 1. Limpiar: Quitamos espacios y comillas accidentales que a veces se copian del .env
    const originalUrl = supabaseUrl;
    supabaseUrl = supabaseUrl.trim().replace(/^["']|["']$/g, '');

    if (originalUrl !== supabaseUrl) {
        console.warn("⚠️ [DEBUG] Se detectaron y eliminaron comillas o espacios en la URL.");
    }

    // 2. Asegurar protocolo HTTPS
    if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
        console.warn("⚠️ [DEBUG] La URL no tenía protocolo (http/https). Se agregó 'https://' automáticamente.");
        supabaseUrl = `https://${supabaseUrl}`;
    }

    console.log("✅ [FINAL] URL utilizada para conexión:", supabaseUrl);
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')