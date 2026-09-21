import React from 'react';

// Reusable Shimmer Skeleton Box
export const SkeletonBox = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200/80 dark:bg-slate-700/50 rounded-xl ${className}`} />
);

// Skeleton for Report Cards (used in ReportHistoryPage)
export const CardSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[...Array(count)].map((_, idx) => (
        <div 
          key={idx} 
          className="rounded-2xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1E293B] p-5 space-y-4 shadow-xs"
        >
          {/* Top row */}
          <div className="flex items-center justify-between">
            <SkeletonBox className="h-6 w-24" />
            <SkeletonBox className="h-6 w-20 rounded-full" />
          </div>

          {/* Title & category */}
          <div className="space-y-2">
            <SkeletonBox className="h-5 w-3/4" />
            <div className="flex items-center justify-between pt-1">
              <SkeletonBox className="h-4 w-16" />
              <SkeletonBox className="h-4 w-20" />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <SkeletonBox className="h-3.5 w-full" />
            <SkeletonBox className="h-3.5 w-5/6" />
          </div>

          {/* Image placeholder */}
          <SkeletonBox className="h-28 w-full rounded-xl" />

          {/* Location & date */}
          <div className="pt-2 border-t border-slate-100 dark:border-[#334155] space-y-2">
            <SkeletonBox className="h-3.5 w-1/2" />
            <SkeletonBox className="h-3.5 w-1/3" />
          </div>

          {/* Button */}
          <SkeletonBox className="h-9 w-full rounded-xl mt-3" />
        </div>
      ))}
    </div>
  );
};

// Skeleton for Admin Table Rows (used in AdminReportsPage)
export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div className="divide-y divide-slate-100 dark:divide-[#334155]">
      {[...Array(rows)].map((_, idx) => (
        <div key={idx} className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <SkeletonBox className="h-5 w-48" />
            <SkeletonBox className="h-3.5 w-32" />
          </div>
          <div className="space-y-2 w-36">
            <SkeletonBox className="h-4 w-32" />
            <SkeletonBox className="h-3.5 w-20" />
          </div>
          <SkeletonBox className="h-4 w-28" />
          <SkeletonBox className="h-8 w-28 rounded-lg" />
          <SkeletonBox className="h-8 w-20 rounded-xl" />
        </div>
      ))}
    </div>
  );
};

// Skeleton for Dashboard Cards & Charts (used in DashboardPage)
export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* 4 Top Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1E293B] p-5 flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <SkeletonBox className="h-3.5 w-20" />
              <SkeletonBox className="h-8 w-14" />
              <SkeletonBox className="h-3 w-16" />
            </div>
            <SkeletonBox className="h-11 w-11 rounded-xl shrink-0" />
          </div>
        ))}
      </div>

      {/* 2-Column Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1E293B] p-6 space-y-4">
          <SkeletonBox className="h-5 w-48" />
          <SkeletonBox className="h-56 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1E293B] p-6 space-y-4">
          <SkeletonBox className="h-5 w-40" />
          <SkeletonBox className="h-56 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export default { SkeletonBox, CardSkeleton, TableSkeleton, DashboardSkeleton };
