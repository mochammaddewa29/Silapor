const { rtdb, ref, get, set, child } = require('./src/config/firebase');

async function testConnection() {
  console.log('Testing Firebase Realtime Database connection...');
  try {
    const testRef = ref(rtdb, '.info/connected');
    const snapshot = await get(testRef);
    console.log('Firebase connected status:', snapshot.val());
  } catch (err) {
    console.error('Error connecting to Firebase RTDB:', err.message);
  }
  process.exit(0);
}

testConnection();
