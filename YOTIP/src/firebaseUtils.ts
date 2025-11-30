// src/firebaseUtils.ts

// Detectar si estamos en producción (Servidor) o Local
const isProduction = import.meta.env.PROD; 
const API_URL = isProduction ? "/api" : "http://localhost:3001";

// --- SISTEMA DE LISTENER (Para que la app se actualice sola) ---
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
    } catch (e) { console.error(e); }
  }
  authListeners.forEach(listener => listener(user));
};

const generateId = () => 'user_' + Date.now() + Math.random().toString(36).substr(2, 9);

// --- FUNCIONES DE BASE DE DATOS ---

// Esta función es la CLAVE. Guarda monedas, objetos, tareas, etc.
// Al usar PATCH, si mandas solo { coins: 50 }, solo actualiza las monedas y no borra lo demás.
export async function saveUserData(userId: string, data: any) {
  try {
    await fetch(`${API_URL}/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (error) {
    console.error("Error guardando datos:", error);
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

// Verificador de nombre de usuario (ignorando al propio usuario si ya lo tiene)
export async function isUsernameAvailable(username: string, excludeUid?: string) {
  try {
    const normalized = username.trim().toLowerCase();
    const response = await fetch(`${API_URL}/users?username=${normalized}`);
    const users = await response.json();
    
    if (users.length > 0) {
      const others = users.filter((u: any) => u.id !== excludeUid);
      return others.length === 0;
    }
    return true;
  } catch (error) {
    return false;
  }
}

export async function registerUsername(username: string, uid: string) {
  const normalized = username.trim().toLowerCase();
  const available = await isUsernameAvailable(normalized, uid);
  
  if (!available) throw new Error('username-taken');

  await saveUserData(uid, { username: normalized });
  await notifyAuthListeners(); // Actualizar pantalla
  return { success: true };
}

// --- AUTENTICACIÓN ---

export async function signUpWithEmail(email: string, password: string) {
  // 1. Verificar si existe
  const checkRes = await fetch(`${API_URL}/users?email=${email}`);
  const existingUsers = await checkRes.json();
  if (existingUsers.length > 0) throw new Error("El correo ya está registrado");

  // 2. Crear usuario con ESTRUCTURA INICIAL COMPLETA
  // Aquí definimos dónde se guardarán las monedas, objetos y tareas
  const newUser = {
    id: generateId(),
    email: email,
    password: password, // En prototipos se guarda así. En real se usaría hash.
    username: null,
    createdAt: Date.now(),
    coins: 0,           // Iniciamos con 0 monedas
    objects: [],        // Array vacío para los objetos de la parcela
    tasks: [],          // Array vacío para las tareas
    theme: 'indigo'     // Tema por defecto
  };

  const createRes = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newUser)
  });

  const user = await createRes.json();
  
  localStorage.setItem('local_auth_uid', user.id);
  await notifyAuthListeners();
  
  return { user: { uid: user.id, email: user.email } };
}

export async function signInWithEmail(email: string, password: string) {
  const response = await fetch(`${API_URL}/users?email=${email}&password=${password}`);
  const users = await response.json();

  if (users.length === 0) throw new Error("Credenciales incorrectas");

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