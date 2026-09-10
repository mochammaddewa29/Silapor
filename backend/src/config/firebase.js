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
  orderBy
} = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyB8SYRjY_GVb4waan64H18lS6MY7hv2V9k",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "silapor-89d37.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "silapor-89d37",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "silapor-89d37.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "320569045525",
  appId: process.env.FIREBASE_APP_ID || "1:320569045525:web:139d9a17fa56d68a84141c"
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
  orderBy,
  firebaseConfig
};
