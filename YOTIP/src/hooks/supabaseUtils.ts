import { supabase } from './supabaseClient'; // Ajusta la ruta si es necesario

// --- AUTH ---
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

// --- DATA ---

export const getUserData = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    // Si no existe, retornamos null para que la App sepa que debe inicializarlo
    if (error.code === 'PGRST116') {
      if (error.code === 'PGRST116') {
        return null;
      }
    }
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
    id: userId,
    updated_at: new Date()
  };

  if (dataToSave.username) updates.username = dataToSave.username;
  if (dataToSave.theme) updates.theme = dataToSave.theme;

  // CORRECCIÓN: Quitamos la validación estricta de 'number' por si acaso
  if (dataToSave.coins !== undefined) {
    updates.coins = parseInt(dataToSave.coins); // Aseguramos que sea entero
  }

  // Si hay objetos o tareas, mezclamos con lo existente
  if (dataToSave.objects || dataToSave.tasks) {
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('game_data')
      .eq('id', userId)
      .maybeSingle();

    const currentJSON = currentProfile?.game_data || { objects: [], tasks: [] };

    updates.game_data = {
      objects: dataToSave.objects !== undefined ? dataToSave.objects : currentJSON.objects,
      tasks: dataToSave.tasks !== undefined ? dataToSave.tasks : currentJSON.tasks
    };
  }

  const { error } = await supabase
    .from('profiles')
    .upsert(updates);

  if (error) {
    throw error;
  }
};

export const registerUsername = async (username: string, userId: string) => {
  const { data } = await supabase.from('profiles').select('id').eq('username', username).single();
  if (data && data.id !== userId) throw new Error("Nombre de usuario ocupado");

  const { error } = await supabase.from('profiles').upsert({ id: userId, username });
  if (error) throw error;
};