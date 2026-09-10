import React from 'react';
import { Clock, Loader2, CheckCircle2, XCircle } from 'lucide-react';

export const StatusBadge = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  switch (status) {
    case 'Menunggu':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-300 ${sizeClasses[size]}`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          Menunggu
        </span>
      );
    case 'Diproses':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-700/60 dark:bg-blue-950/40 dark:text-blue-300 ${sizeClasses[size]}`}
        >
          <Loader2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-spin" />
          Diproses
        </span>
      );
    case 'Selesai':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:text-emerald-300 ${sizeClasses[size]}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          Selesai
        </span>
      );
    case 'Ditolak':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-700/60 dark:bg-rose-950/40 dark:text-rose-300 ${sizeClasses[size]}`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          Ditolak
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 ${sizeClasses[size]}`}
        >
          {status || 'Unknown'}
        </span>
      );
  }
};

export default StatusBadge;
