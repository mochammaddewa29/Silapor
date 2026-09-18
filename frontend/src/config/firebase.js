import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDbdljdSQgZVBTwNmqu9m0Am1J6-j_KhiA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "lapor-jakban.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "lapor-jakban",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "lapor-jakban.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "67158539414",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:67158539414:web:45f338d945c40af7c2d6b7",
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
