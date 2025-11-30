// src/firebaseUtils.ts

// Detectar entorno: Servidor (/api) o Local (localhost:3002)
const isProduction = import.meta.env.PROD; 
// IMPORTANTE: Si estás probando en el servidor, usará /api.
const API_URL = isProduction ? "/api" : "http://localhost:3002";

// --- SISTEMA DE NOTIFICACIONES ---
let authListeners: ((user: any) => void)[] = [];

const notifyAuthListeners = async () => {
  const uid = localStorage.getItem('local_auth_uid');
  let user = null;
  if (uid) {
    try {
      const userData = await getUserData(uid);
      if (userData) {
        user = { uid: uid, email: userData.email };
      }
    } catch (e) { console.error("Error notificando:", e); }
  }
  authListeners.forEach(listener => listener(user));
};

const generateId = () => 'user_' + Date.now() + Math.random().toString(36).substr(2, 9);

// --- FUNCIONES DE BASE DE DATOS ---

export async function saveUserData(userId: string, data: any) {
  console.log("💾 Guardando datos para:", userId, data); // LOG
  try {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Error en PATCH saveUserData");
    console.log("✅ Datos guardados correctamente");
  } catch (error) {
    console.error("❌ Error CRÍTICO al guardar:", error);
  }
}

export async function getUserData(userId: string) {
  try {
    const response = await fetch(`${API_URL}/users/${userId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
}

// Verifica disponibilidad del nombre (Excluyendo al propio usuario si ya lo tiene)
export async function isUsernameAvailable(username: string, excludeUid?: string) {
  try {
    const normalized = username.trim().toLowerCase();
    const response = await fetch(`${API_URL}/users?username=${normalized}`);
    const users = await response.json();
    
    if (users.length > 0) {
      // Si el único que tiene ese nombre soy yo mismo, entonces SÍ está disponible
      const others = users.filter((u: any) => u.id !== excludeUid);
      return others.length === 0;
    }
    return true;
  } catch (error) {
    return false;
  }
}

export async function registerUsername(username: string, uid: string) {
  console.log("📝 Intentando registrar nombre:", username); // LOG
  const normalized = username.trim().toLowerCase();
  const available = await isUsernameAvailable(normalized, uid);
  
  if (!available) {
    console.warn("⚠️ Nombre ocupado");
    throw new Error('username-taken');
  }

  // Guardamos el nombre usando la función genérica
  await saveUserData(uid, { username: normalized });
  
  // Forzamos actualización visual
  await notifyAuthListeners(); 
  return { success: true };
}

// --- AUTENTICACIÓN (LOGIN Y REGISTRO) ---

export async function signUpWithEmail(email: string, password: string) {
  console.log("🚀 Iniciando Registro para:", email); // LOG

  // 1. Verificar si existe (GET)
  const checkRes = await fetch(`${API_URL}/users?email=${email}`);
  const existingUsers = await checkRes.json();
  
  console.log("🔍 Resultado búsqueda correo:", existingUsers); // LOG

  if (existingUsers.length > 0) {
    throw new Error("El correo ya está registrado");
  }

  // 2. Preparar el usuario NUEVO con todos los datos iniciales
  const newUser = {
    id: generateId(),
    email: email,
    password: password, 
    username: null,
    createdAt: Date.now(),
    coins: 0,           // Monedas iniciales
    objects: [],        // Inventario vacío
    tasks: [],          // Tareas vacías
    theme: 'indigo'
  };

  console.log("📦 Enviando usuario a la base de datos:", newUser); // LOG

  // 3. Guardar en Base de Datos (POST)
  const createRes = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newUser)
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    console.error("❌ Error del servidor al crear:", createRes.status, errorText);
    throw new Error(`Error del servidor: ${createRes.status}`);
  }

  const user = await createRes.json();
  console.log("✨ Usuario creado con éxito:", user); // LOG
  
  // 4. Guardar sesión local y avisar
  localStorage.setItem('local_auth_uid', user.id);
  await notifyAuthListeners();
  
  return { user: { uid: user.id, email: user.email } };
}

export async function signInWithEmail(email: string, password: string) {
  console.log("🔑 Intentando Login:", email); // LOG
  
  // Buscamos coincidencia exacta de email y password
  // NOTA: json-server permite filtrar por múltiples campos con &
  const response = await fetch(`${API_URL}/users?email=${email}&password=${password}`);
  const users = await response.json();

  console.log("🔍 Resultado Login:", users); // LOG

  if (users.length === 0) {
    throw new Error("Credenciales incorrectas");
  }

  const user = users[0];
  localStorage.setItem('local_auth_uid', user.id);
  await notifyAuthListeners();
  
  return { user: { uid: user.id, email: user.email } };
}

export async function signOutUser() {
  localStorage.removeItem('local_auth_uid');
  await notifyAuthListeners();
  return true;
}

export function onAuthStateChanged(callback: (user: any) => void) {
  authListeners.push(callback);
  notifyAuthListeners();
  return () => {
    authListeners = authListeners.filter(l => l !== callback);
  };
}