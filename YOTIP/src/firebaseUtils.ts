import { doc, getDoc, setDoc, runTransaction, serverTimestamp, collection, query, where, getDocs, updateDoc, arrayUnion } from "firebase/firestore";
import { db, auth } from "./firebaseConfig";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged as firebaseOnAuthStateChanged } from 'firebase/auth';

// --- TUS FUNCIONES EXISTENTES (MANTENLAS IGUAL) ---

export async function saveUserData(userId: string, data: any) {
  try {
    await setDoc(doc(db, "users", userId), data, { merge: true });
    console.log("Datos guardados correctamente en Firestore");
  } catch (error) {
    console.error("Error al guardar datos en Firestore:", error);
  }
}

export async function getUserData(userId: string) {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error al leer datos de Firestore:", error);
    return null;
  }
}

export async function isUsernameAvailable(username: string) {
  try {
    const normalized = username.trim().toLowerCase();
    const docRef = doc(db, 'usernames', normalized);
    const snap = await getDoc(docRef);
    return !snap.exists();
  } catch (error) {
    console.error('Error comprobando username:', error);
    return false;
  }
}

export async function registerUsername(username: string, uid: string) {
  const normalized = username.trim().toLowerCase();
  const usernameRef = doc(db, 'usernames', normalized);
  const userRef = doc(db, 'users', uid);
  try {
    await runTransaction(db, async (tx) => {
      const userSnap = await tx.get(userRef);
      if (userSnap.exists() && userSnap.data() && (userSnap.data() as any).username) {
        throw new Error('user-already-has-username');
      }
      const nameSnap = await tx.get(usernameRef);
      if (nameSnap.exists()) {
        throw new Error('username-taken');
      }
      tx.set(usernameRef, { uid, createdAt: serverTimestamp() });
      tx.set(userRef, { username: normalized }, { merge: true });
    });
    return { success: true };
  } catch (err) {
    if ((err as any)?.code === 'permission-denied') {
      throw new Error('permission-denied');
    }
    throw err;
  }
}

export async function signUpWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signOutUser() {
  return firebaseSignOut(auth);
}

export function onAuthStateChanged(callback: (user: any) => void) {
  return firebaseOnAuthStateChanged(auth, callback);
}

// --- NUEVAS FUNCIONES PARA EQUIPOS (AGREGAR AL FINAL) ---

// Crear equipo
export async function createTeam(teamName: string, creatorUid: string) {
  const teamId = "team_" + Date.now();
  const teamRef = doc(db, "teams", teamId);
  const userRef = doc(db, "users", creatorUid);

  try {
    await runTransaction(db, async (tx) => {
      tx.set(teamRef, {
        name: teamName,
        members: [creatorUid],
        createdAt: serverTimestamp()
      });
      tx.update(userRef, { teamId: teamId });
    });
    return teamId;
  } catch (error) {
    console.error("Error creando equipo:", error);
    throw error;
  }
}

// Buscar equipo por nombre exacto
export async function findTeamByName(name: string) {
  try {
    const teamsRef = collection(db, "teams");
    const q = query(teamsRef, where("name", "==", name));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("Error buscando equipo:", error);
    return null;
  }
}

// Unirse a equipo
export async function joinTeam(teamId: string, uid: string) {
  const teamRef = doc(db, "teams", teamId);
  const userRef = doc(db, "users", uid);

  try {
    await runTransaction(db, async (tx) => {
      const teamDoc = await tx.get(teamRef);
      if (!teamDoc.exists()) throw new Error("El equipo no existe");
      tx.update(teamRef, { members: arrayUnion(uid) });
      tx.update(userRef, { teamId: teamId });
    });
    return true;
  } catch (error) {
    console.error("Error uniéndose:", error);
    throw error;
  }
}

// Obtener datos de la aldea (miembros)
export async function getTeamVillageData(teamId: string) {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("teamId", "==", teamId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ 
      uid: doc.id, 
      username: doc.data().username || "Anonimo",
      coins: doc.data().coins || 0,
      // No traemos 'objects' pesados aquí para optimizar, solo info básica
    }));
  } catch (error) {
    console.error("Error cargando aldea:", error);
    return [];
  }
}