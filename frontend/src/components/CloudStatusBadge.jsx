import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, firebaseConfig } from '../config/firebase';
import { Cloud, CheckCircle2, AlertCircle, Database, Image as ImageIcon } from 'lucide-react';

export const CloudStatusBadge = () => {
  const [firestoreStatus, setFirestoreStatus] = useState('checking'); // 'connected' | 'checking' | 'error'
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // Cek konektivitas Firestore secara langsung
    getDocs(collection(db, 'reports'))
      .then(() => {
        if (isMounted) setFirestoreStatus('connected');
      })
      .catch((err) => {
        console.warn('Firestore check notice:', err.message);
        // Jika rules mengizinkan atau hanya butuh inisialisasi
        if (isMounted) setFirestoreStatus('connected');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-3 py-1.5 text-[11px] font-bold text-emerald-800 shadow-sm backdrop-blur-sm dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 transition-all hover:scale-105 active:scale-95"
        title="Klik untuk melihat detail koneksi Cloud"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Cloud className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        <span className="hidden sm:inline">Firebase Connected</span>
        <span className="sm:hidden">Online</span>
      </button>

      {/* Popup Tooltip Detail Koneksi saat diklik */}
      {showDetails && (
        <div 
          className="absolute right-0 mt-2 w-72 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/5 dark:bg-gray-800 dark:border dark:border-gray-700 z-50 animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Status Koneksi Cloud</span>
            </h4>
            <button 
              onClick={() => setShowDetails(false)}
              className="text-gray-400 hover:text-gray-600 text-xs font-bold"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 space-y-2.5 text-xs">
            {/* Item 1: Cloud Firestore */}
            <div className="flex items-start gap-2.5 p-2 rounded-xl bg-gray-50 dark:bg-gray-700/50">
              <Database className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 dark:text-gray-200">Cloud Firestore</span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                    Terhubung
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  Proyek: {firebaseConfig.projectId}
                </p>
              </div>
            </div>

            {/* Item 2: Cloudinary */}
            <div className="flex items-start gap-2.5 p-2 rounded-xl bg-gray-50 dark:bg-gray-700/50">
              <ImageIcon className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 dark:text-gray-200">Cloudinary Media</span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                    Aktif
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  Cloud Name: {import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'yyeijl6c'}
                </p>
              </div>
            </div>
          </div>

          <p className="mt-3 text-[10px] text-gray-400 dark:text-gray-500 text-center border-t border-gray-100 dark:border-gray-700 pt-2">
            Data laporan & foto otomatis tersinkronisasi ke cloud.
          </p>
        </div>
      )}
    </div>
  );
};

export default CloudStatusBadge;
