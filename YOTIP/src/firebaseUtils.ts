// src/firebaseUtils.ts

// --- CONFIGURACIÓN ---
// Si estás en producción usa /api, si estás en local usa localhost:3001
const isProduction = import.meta.env.PROD; 
const API_URL = isProduction ? "/api" : "http://localhost:3001";

// --- SISTEMA DE NOTIFICACIONES (LA MAGIA) ---
// Aquí guardamos las funciones que React nos da para avisarle
let authListeners: ((user: any) => void)[] = [];

const notifyAuthListeners = async () => {
  const uid = localStorage.getItem('local_auth_uid');
  let user = null;

  if (uid) {
    try {
      // Intentamos obtener datos frescos
      const userData = await getUserData(uid);
      if (userData) {
        user = { uid: uid, email: userData.email };
      }
    } catch (e) {
      console.error("Error validando sesión:", e);
    }
  }

  // Avisamos a todas las partes de la App que estén escuchando
  authListeners.forEach(listener => listener(user));
};

const generateId = () => 'user_' + Date.now() + Math.random().toString(36).substr(2, 9);


// --- FUNCIONES DE BASE DE DATOS ---

export async function saveUserData(userId: string, data: any) {
  try {
    await fetch(`${API_URL}/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (error) {
    console.error("Error al guardar datos:", error);
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

export async function isUsernameAvailable(username: string) {
  try {
    const normalized = username.trim().toLowerCase();
    const response = await fetch(`${API_URL}/users?username=${normalized}`);
    const users = await response.json();
    return users.length === 0;
  } catch (error) {
    return false;
  }
}

export async function registerUsername(username: string, uid: string) {
  const normalized = username.trim().toLowerCase();
  const available = await isUsernameAvailable(normalized);
  if (!available) throw new Error('username-taken');

  try {
    await fetch(`${API_URL}/users/${uid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: normalized })
    });
    return { success: true };
  } catch (err) {
    throw err;
  }
}

// --- AUTHENTICATION (MODIFICADO PARA SER REACTIVO) ---

export async function signUpWithEmail(email: string, password: string) {
  const checkRes = await fetch(`${API_URL}/users?email=${email}`);
  const existingUsers = await checkRes.json();
  
  if (existingUsers.length > 0) throw new Error("El correo ya está registrado");

  const newUser = {
    id: generateId(),
    email: email,
    password: password,
    createdAt: Date.now(),
    coins: 0,
    objects: [],
    tasks: []
  };

  const createRes = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newUser)
  });

  const user = await createRes.json();
  
  // 1. Guardamos en disco
  localStorage.setItem('local_auth_uid', user.id);
  
  // 2. ¡AVISAMOS A REACT DE INMEDIATO!
  await notifyAuthListeners();
  
  return { user: { uid: user.id, email: user.email } };
}

export async function signInWithEmail(email: string, password: string) {
  const response = await fetch(`${API_URL}/users?email=${email}&password=${password}`);
  const users = await response.json();

  if (users.length === 0) throw new Error("Credenciales incorrectas");

  const user = users[0];
  
  // 1. Guardamos en disco
  localStorage.setItem('local_auth_uid', user.id);

  // 2. ¡AVISAMOS A REACT DE INMEDIATO!
  await notifyAuthListeners();
  
  return { user: { uid: user.id, email: user.email } };
}

export async function signOutUser() {
  localStorage.removeItem('local_auth_uid');
  // Avisamos que se cerró sesión (pasará null)
  await notifyAuthListeners();
  return true;
}

// Esta es la función que usa tu App.tsx para "escuchar"
export function onAuthStateChanged(callback: (user: any) => void) {
  // Agregamos la función de App.tsx a nuestra lista de "contactos"
  authListeners.push(callback);
  
  // Ejecutamos una vez al inicio para ver si ya había sesión guardada
  notifyAuthListeners();

  // Devolvemos una función para dejar de escuchar (limpieza)
  return () => {
    authListeners = authListeners.filter(l => l !== callback);
  };
}

// --- EQUIPOS ---

export async function createTeam(teamName: string, creatorUid: string) {
  const teamId = "team_" + Date.now();
  
  await fetch(`${API_URL}/teams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: teamId,
      name: teamName,
      members: [creatorUid],
      createdAt: Date.now()
    })
  });

  await fetch(`${API_URL}/users/${creatorUid}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId: teamId })
  });

  return teamId;
}

export async function findTeamByName(name: string) {
  try {
    const response = await fetch(`${API_URL}/teams?name=${name}`);
    const teams = await response.json();
    return teams.length > 0 ? teams[0] : null;
  } catch (error) {
    return null;
  }
}

export async function joinTeam(teamId: string, uid: string) {
  const teamRes = await fetch(`${API_URL}/teams/${teamId}`);
  const team = await teamRes.json();
  const newMembers = [...new Set([...team.members, uid])];

  await fetch(`${API_URL}/teams/${teamId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ members: newMembers })
  });

  await fetch(`${API_URL}/users/${uid}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId: teamId })
  });

  return true;
}

export async function getTeamVillageData(teamId: string) {
  try {
    const response = await fetch(`${API_URL}/users?teamId=${teamId}`);
    const users = await response.json();
    return users.map((u: any) => ({
      uid: u.id,
      username: u.username || "Anonimo",
      coins: u.coins || 0
    }));
  } catch (error) {
    return [];
  }
}