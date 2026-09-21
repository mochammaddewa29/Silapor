import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAUfqyvpkxDTGD5FqX011l-Z4P9JXRD1MY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "laporjakban-8e0b9.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "laporjakban-8e0b9",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "laporjakban-8e0b9.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "773167711266",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:773167711266:web:737e3022c4d2d564fef67b",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-75W4KVVCQ6"
};

// Inisialisasi Firebase App
const app = initializeApp(firebaseConfig);

// Inisialisasi Cloud Firestore & Auth
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, db, auth, googleProvider, firebaseConfig };
export default app;
