// NOTA: Si usaste la opción del parche, verifica que la ruta a client sea correcta
import { supabase } from './supabaseClient'; 
// Si te marca error en la línea de arriba, prueba con: import { supabase } from '../../supabaseClient';
// o asegurate de donde está tu archivo supabaseClient.ts

// --- AUTH (Sin cambios) ---
export const signUpWithEmail = async (email: string, pass: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password: pass });
  if (error) throw error;
  return data.user;
};

export const signInWithEmail = async (email: string, pass: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
  if (error) throw error;
  return data.user;
};

export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const onAuthStateChanged = (callback: (user: any) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
  return () => subscription.unsubscribe();
};

// --- DATA (AQUÍ ESTÁ LA MAGIA CORREGIDA) ---

export const getUserData = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    // CORRECCIÓN: Usamos solo 'code' porque 'status' no existe en el tipo TypeScript
    // PGRST116 es el código oficial de Supabase para "Resultados vacíos" con .single()
    if (error.code === 'PGRST116') {
      console.warn("Usuario nuevo detectado (sin perfil en DB).");
      return null;
    }
    
    // Si es otro error, lo lanzamos
    throw error;
  }

  const gameData = data.game_data || { objects: [], tasks: [] };

  return {
    username: data.username,
    theme: data.theme,
    coins: data.coins,
    objects: gameData.objects || [],
    tasks: gameData.tasks || []
  };
};

export const saveUserData = async (userId: string, dataToSave: any) => {
  const updates: any = { 
    id: userId, // Importante para el upsert
    updated_at: new Date() 
  };

  if (dataToSave.username) updates.username = dataToSave.username;
  if (dataToSave.theme) updates.theme = dataToSave.theme;
  if (typeof dataToSave.coins === 'number') updates.coins = dataToSave.coins;

  // Lógica de mezcla para JSON (Objetos y Tareas)
  if (dataToSave.objects || dataToSave.tasks) {
    // Intentamos leer datos actuales, si falla asumimos vacíos
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('game_data')
      .eq('id', userId)
      .maybeSingle(); // maybeSingle no da error 406

    const currentJSON = currentProfile?.game_data || { objects: [], tasks: [] };
    
    updates.game_data = {
      objects: dataToSave.objects !== undefined ? dataToSave.objects : currentJSON.objects,
      tasks: dataToSave.tasks !== undefined ? dataToSave.tasks : currentJSON.tasks
    };
  }

  // CORRECCIÓN CRÍTICA: Usamos UPSERT en lugar de UPDATE
  // Si la fila no existe, la crea. Si existe, la actualiza.
  const { error } = await supabase
    .from('profiles')
    .upsert(updates);

  if (error) {
    console.error("Error guardando en Supabase:", error);
    throw error;
  }
};

export const registerUsername = async (username: string, userId: string) => {
  const { data } = await supabase.from('profiles').select('id').eq('username', username).single();
  if (data && data.id !== userId) throw new Error("Nombre de usuario ocupado");

  // También usamos upsert aquí por seguridad
  const { error } = await supabase.from('profiles').upsert({ id: userId, username });
  if (error) throw error;
};