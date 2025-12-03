import React from 'react';

export const SummarySkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Risk Header */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-100 dark:border-slate-700 shadow-sm">
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-24 mb-3 animate-shimmer"></div>
          <div className="h-6 bg-gray-300 dark:bg-slate-600 rounded-full w-20 ml-auto animate-shimmer"></div>
        </div>
      ))}
    </div>

    {/* Main Recommendation */}
    <div className="bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-xl p-8">
      <div className="h-6 bg-slate-400 dark:bg-slate-500 rounded w-48 mb-4 animate-shimmer"></div>
      <div className="space-y-3">
        <div className="h-4 bg-slate-400 dark:bg-slate-500 rounded w-full animate-shimmer"></div>
        <div className="h-4 bg-slate-400 dark:bg-slate-500 rounded w-full animate-shimmer"></div>
        <div className="h-4 bg-slate-400 dark:bg-slate-500 rounded w-3/4 animate-shimmer"></div>
      </div>
    </div>

    {/* Summary */}
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
      <div className="h-5 bg-gray-300 dark:bg-slate-600 rounded w-40 mb-3 animate-shimmer"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full animate-shimmer"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full animate-shimmer"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-5/6 animate-shimmer"></div>
      </div>
    </div>
  </div>
);

export const ExpertsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {[1, 2, 3].map((i) => (
      <div key={i} className="rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gray-300 dark:bg-slate-600 rounded-full animate-shimmer"></div>
          <div className="flex-1">
            <div className="h-5 bg-gray-300 dark:bg-slate-600 rounded w-24 mb-2 animate-shimmer"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-32 animate-shimmer"></div>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full w-16 animate-shimmer"></div>
        </div>
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full animate-shimmer"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full animate-shimmer"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-4/5 animate-shimmer"></div>
        </div>
        <div className="bg-white/60 dark:bg-slate-700/60 rounded-lg p-4">
          <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-32 mb-3 animate-shimmer"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-full animate-shimmer"></div>
            <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-5/6 animate-shimmer"></div>
            <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-4/5 animate-shimmer"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const CitationsSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
    <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
      <div className="h-6 bg-gray-300 dark:bg-slate-600 rounded w-64 mb-2 animate-shimmer"></div>
      <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-96 animate-shimmer"></div>
    </div>
    <div className="divide-y divide-gray-100 dark:divide-slate-700">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-6">
          <div className="flex items-start justify-between mb-2">
            <div className="h-5 bg-gray-300 dark:bg-slate-600 rounded w-48 animate-shimmer"></div>
            <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-32 animate-shimmer"></div>
          </div>
          <div className="h-16 bg-gray-100 dark:bg-slate-700 rounded-md mt-3 animate-shimmer"></div>
        </div>
      ))}
    </div>
  </div>
);

export const ExportSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 max-w-4xl mx-auto my-4 min-h-[600px]">
    <div className="bg-gray-100 dark:bg-slate-900/50 p-4 border-b dark:border-slate-700">
      <div className="h-5 bg-gray-300 dark:bg-slate-600 rounded w-32 animate-shimmer"></div>
    </div>
    <div className="p-12">
      <div className="text-center mb-10">
        <div className="h-8 bg-gray-300 dark:bg-slate-600 rounded w-64 mx-auto mb-2 animate-shimmer"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-40 mx-auto animate-shimmer"></div>
        <div className="h-px bg-gray-300 dark:bg-slate-600 mt-6"></div>
      </div>
      <div className="space-y-8">
        <div>
          <div className="h-6 bg-gray-300 dark:bg-slate-600 rounded w-48 mb-3 animate-shimmer"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full animate-shimmer"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full animate-shimmer"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 animate-shimmer"></div>
          </div>
        </div>
        <div>
          <div className="h-6 bg-gray-300 dark:bg-slate-600 rounded w-40 mb-3 animate-shimmer"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-5 bg-gray-300 dark:bg-slate-600 rounded w-56 mb-2 animate-shimmer"></div>
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full animate-shimmer"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

