require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc,
  query,
  where,
  limit,
  orderBy
} = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDbdljdSQgZVBTwNmqu9m0Am1J6-j_KhiA",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "lapor-jakban.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "lapor-jakban",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "lapor-jakban.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "67158539414",
  appId: process.env.FIREBASE_APP_ID || "1:67158539414:web:45f338d945c40af7c2d6b7",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-75W4KVVCQ6"
};

// Inisialisasi Firebase App
const app = initializeApp(firebaseConfig);

// Inisialisasi Cloud Firestore
const db = getFirestore(app);

module.exports = {
  app,
  db,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  where,
  limit,
  orderBy,
  firebaseConfig
};
