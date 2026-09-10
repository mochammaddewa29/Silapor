import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';

export const PriorityBadge = ({ priority, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] font-medium',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  switch (priority) {
    case 'Tinggi':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60 ${sizeClasses[size]}`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
          Tinggi
        </span>
      );
    case 'Sedang':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 ${sizeClasses[size]}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          Sedang
        </span>
      );
    case 'Rendah':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 ${sizeClasses[size]}`}
        >
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          Rendah
        </span>
      );
  }
};

export default PriorityBadge;
