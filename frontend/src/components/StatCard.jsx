import React from 'react';

export const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      icon: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-100 dark:border-blue-900/50',
      glow: 'hover:shadow-blue-500/10',
    },
    yellow: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      icon: 'text-amber-500 dark:text-amber-400',
      border: 'border-amber-100 dark:border-amber-900/50',
      glow: 'hover:shadow-amber-500/10',
    },
    green: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      icon: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-100 dark:border-emerald-900/50',
      glow: 'hover:shadow-emerald-500/10',
    },
    purple: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      icon: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-100 dark:border-indigo-900/50',
      glow: 'hover:shadow-indigo-500/10',
    },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-gray-800 dark:border-gray-700/80 ${scheme.border} ${scheme.glow}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            {value}
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
        </div>
        <div
          className={`flex h-13 w-13 items-center justify-center rounded-2xl ${scheme.bg} ${scheme.icon} shadow-inner`}
        >
          {Icon && <Icon className="h-6 w-6" />}
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
