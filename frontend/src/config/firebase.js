import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB8SYRjY_GVb4waan64H18lS6MY7hv2V9k",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "silapor-89d37.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "silapor-89d37",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "silapor-89d37.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "320569045525",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:320569045525:web:139d9a17fa56d68a84141c"
};

// Inisialisasi Firebase App
const app = initializeApp(firebaseConfig);

// Inisialisasi Cloud Firestore
const db = getFirestore(app);

export { app, db, firebaseConfig };
export default app;
