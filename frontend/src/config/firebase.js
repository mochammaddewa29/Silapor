import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCYCaUY6JYpWXui5UCs-1YtzafUNTP57n0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "silapor-388a9.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "silapor-388a9",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "silapor-388a9.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "830917271693",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:830917271693:web:596ab1ce84f8c8f51282c4"
};

// Inisialisasi Firebase App
const app = initializeApp(firebaseConfig);

// Inisialisasi Cloud Firestore
const db = getFirestore(app);

export { app, db, firebaseConfig };
export default app;
