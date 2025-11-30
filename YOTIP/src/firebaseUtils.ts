// src/firebaseUtils.ts

// URL de tu json-server (asegúrate de correrlo en el puerto 3001)
const API_URL = "/api";

// --- UTILIDADES DE AYUDA ---

// Función para simular un ID único (ya que no tenemos Firebase Auth)
const generateId = () => 'user_' + Date.now() + Math.random().toString(36).substr(2, 9);

// --- FUNCIONES DE BASE DE DATOS ---

export async function saveUserData(userId: string, data: any) {
  try {
    // En json-server, usamos PATCH para actualizar solo los campos enviados
    await fetch(`${API_URL}/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    console.log("Datos guardados localmente");
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
    console.error("Error al leer datos:", error);
    return null;
  }
}

export async function isUsernameAvailable(username: string) {
  try {
    const normalized = username.trim().toLowerCase();
    // Buscamos si alguien ya tiene este username
    const response = await fetch(`${API_URL}/users?username=${normalized}`);
    const users = await response.json();
    return users.length === 0;
  } catch (error) {
    console.error('Error comprobando username:', error);
    return false;
  }
}

export async function registerUsername(username: string, uid: string) {
  const normalized = username.trim().toLowerCase();
  
  // 1. Verificar disponibilidad de nuevo
  const available = await isUsernameAvailable(normalized);
  if (!available) throw new Error('username-taken');

  // 2. Guardar en el usuario
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

// --- FUNCIONES DE AUTH SIMULADA ---

export async function signUpWithEmail(email: string, password: string) {
  // 1. Verificar si el email ya existe
  const checkRes = await fetch(`${API_URL}/users?email=${email}`);
  const existingUsers = await checkRes.json();
  
  if (existingUsers.length > 0) {
    throw new Error("El correo ya está registrado");
  }

  // 2. Crear usuario nuevo
  const newUser = {
    id: generateId(),
    email: email,
    password: password, // NOTA: En un proyecto real, nunca guardes contraseñas en texto plano
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
  
  // Simular inicio de sesión guardando en localStorage
  localStorage.setItem('local_auth_uid', user.id);
  
  return { user: { uid: user.id, email: user.email } };
}

export async function signInWithEmail(email: string, password: string) {
  // Buscar usuario que coincida con email y password
  const response = await fetch(`${API_URL}/users?email=${email}&password=${password}`);
  const users = await response.json();

  if (users.length === 0) {
    throw new Error("Credenciales incorrectas");
  }

  const user = users[0];
  localStorage.setItem('local_auth_uid', user.id);
  
  return { user: { uid: user.id, email: user.email } };
}

export async function signOutUser() {
  localStorage.removeItem('local_auth_uid');
  // Recargar página para limpiar estados es lo más fácil en este cambio
  window.location.reload(); 
  return true;
}

// Simulamos el listener de Firebase comprobando localStorage
export function onAuthStateChanged(callback: (user: any) => void) {
  const storedUid = localStorage.getItem('local_auth_uid');
  
  if (storedUid) {
    // Si hay ID guardado, obtenemos el usuario y ejecutamos el callback
    getUserData(storedUid).then(userData => {
      if (userData) {
        callback({ uid: storedUid, email: userData.email });
      } else {
        localStorage.removeItem('local_auth_uid');
        callback(null);
      }
    });
  } else {
    callback(null);
  }

  // Retornamos una función vacía para simular el unsubscribe
  return () => {}; 
}

// --- FUNCIONES DE EQUIPOS (ADAPTADAS) ---

export async function createTeam(teamName: string, creatorUid: string) {
  const teamId = "team_" + Date.now();
  
  // 1. Crear el equipo
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

  // 2. Actualizar al usuario
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
    console.error("Error buscando equipo:", error);
    return null;
  }
}

export async function joinTeam(teamId: string, uid: string) {
  // 1. Obtener equipo actual para ver sus miembros
  const teamRes = await fetch(`${API_URL}/teams/${teamId}`);
  const team = await teamRes.json();

  // 2. Agregar usuario al array de miembros (evitando duplicados)
  const newMembers = [...new Set([...team.members, uid])];

  await fetch(`${API_URL}/teams/${teamId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ members: newMembers })
  });

  // 3. Asignar teamId al usuario
  await fetch(`${API_URL}/users/${uid}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId: teamId })
  });

  return true;
}

export async function getTeamVillageData(teamId: string) {
  try {
    // json-server permite filtrar usuarios por teamId directamente
    const response = await fetch(`${API_URL}/users?teamId=${teamId}`);
    const users = await response.json();
    
    return users.map((u: any) => ({
      uid: u.id,
      username: u.username || "Anonimo",
      coins: u.coins || 0
    }));
  } catch (error) {
    console.error("Error cargando aldea:", error);
    return [];
  }
}