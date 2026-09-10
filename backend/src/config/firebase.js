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
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyCYCaUY6JYpWXui5UCs-1YtzafUNTP57n0",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "silapor-388a9.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "silapor-388a9",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "silapor-388a9.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "830917271693",
  appId: process.env.FIREBASE_APP_ID || "1:830917271693:web:596ab1ce84f8c8f51282c4"
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
