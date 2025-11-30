import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuración con la CLAVE VIEJA (AIzaSyD3...)
const firebaseConfig = {
  apiKey: "AIzaSyD3gG3qM5A1tow777bsfZ1jJd5zmJrkQq0", // <--- Clave Vieja
  authDomain: "yourtime-proyecto-escuela.firebaseapp.com",
  projectId: "yourtime-proyecto-escuela",
  storageBucket: "yourtime-proyecto-escuela.firebasestorage.app",
  messagingSenderId: "666837926457",
  appId: "1:666837926457:web:617ebfbaa7dd46b20a83e8"
};

// Inicializar
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);