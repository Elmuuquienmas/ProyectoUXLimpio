// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// DATOS DUROS (HARDCODED) - SI ESTO NO FUNCIONA, ES CULPA DE GOOGLE
const firebaseConfig = {
  apiKey: "AIzaSyCp6KbX3t56efANf7_w9pJOKwAaOxroKFo",
  authDomain: "yourtime-proyecto-escuela.firebaseapp.com",
  projectId: "yourtime-proyecto-escuela",
  storageBucket: "yourtime-proyecto-escuela.firebasestorage.app",
  messagingSenderId: "666837926457",
  appId: "1:666837926457:web:617ebfbaa7dd46b20a83e8"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);