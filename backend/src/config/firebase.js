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
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyAUfqyvpkxDTGD5FqX011l-Z4P9JXRD1MY",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "laporjakban-8e0b9.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "laporjakban-8e0b9",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "laporjakban-8e0b9.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "773167711266",
  appId: process.env.FIREBASE_APP_ID || "1:773167711266:web:737e3022c4d2d564fef67b",
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
