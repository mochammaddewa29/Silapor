import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Hook untuk memantau data laporan secara real-time dari Cloud Firestore
 * @param {Function} onUpdateCallback - opsional callback yang dipanggil saat ada data baru/berubah
 * @returns {Array} list laporan realtime
 */
export function useRealtimeReports(onUpdateCallback) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const reportsCollection = collection(db, 'reports');
      const q = query(reportsCollection);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list = snapshot.docs.map((doc) => ({
            ...doc.data(),
            firestoreId: doc.id,
          })).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

          setReports(list);
          if (onUpdateCallback) {
            onUpdateCallback(list);
          }
          setLoading(false);
        },
        (error) => {
          console.warn('Firestore listener notice:', error.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Gagal menghubungkan Firestore listener:', err.message);
      setLoading(false);
    }
  }, []);

  return { reports, loading };
}

export default useRealtimeReports;
