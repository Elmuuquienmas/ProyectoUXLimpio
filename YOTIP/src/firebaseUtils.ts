import { doc, getDoc, setDoc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./firebaseConfig";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged as firebaseOnAuthStateChanged } from 'firebase/auth';

// Guardar datos del usuario
export async function saveUserData(userId: string, data: any) {
  try {
    await setDoc(doc(db, "users", userId), data, { merge: true });
    console.log("Datos guardados correctamente en Firestore");
  } catch (error) {
    console.error("Error al guardar datos en Firestore:", error);
  }
}

// Leer datos del usuario
export async function getUserData(userId: string) {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.log("No se encontraron datos para este usuario");
      return null;
    }
  } catch (error) {
    console.error("Error al leer datos de Firestore:", error);
    return null;
  }
}

// Verificar si un username está disponible (simple check)
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

// Registrar un username de forma atómica usando transacción
// Lanza Error con message 'username-taken' si ya existe
// Lanza Error con message 'user-already-has-username' si el usuario ya tiene username
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
    console.error('registerUsername error:', err);
    // Map Firestore permission error to a clearer message for the UI
    if ((err as any)?.code === 'permission-denied') {
      throw new Error('permission-denied');
    }
    throw err;
  }
}

// --- Auth helpers ---
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
