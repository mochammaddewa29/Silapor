const { db, collection, getDocs } = require('./src/config/firebase');

async function testConnection() {
  console.log('Testing Firebase Cloud Firestore connection...');
  try {
    const colRef = collection(db, 'users');
    const snapshot = await getDocs(colRef);
    console.log(`Firebase connected successfully. Found ${snapshot.size} users.`);
  } catch (err) {
    console.error('Error connecting to Firebase Firestore:', err.message);
  }
  process.exit(0);
}

testConnection();
