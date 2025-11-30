import React from 'react';

export const SummarySkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    {/* Risk Header */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
          <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
          <div className="h-6 bg-gray-300 rounded-full w-20 ml-auto"></div>
        </div>
      ))}
    </div>

    {/* Main Recommendation */}
    <div className="bg-gradient-to-r from-slate-200 to-slate-300 rounded-xl p-8">
      <div className="h-6 bg-slate-400 rounded w-48 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-slate-400 rounded w-full"></div>
        <div className="h-4 bg-slate-400 rounded w-full"></div>
        <div className="h-4 bg-slate-400 rounded w-3/4"></div>
      </div>
    </div>

    {/* Summary */}
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="h-5 bg-gray-300 rounded w-40 mb-3"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  </div>
);

export const ExpertsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
    {[1, 2, 3].map((i) => (
      <div key={i} className="rounded-xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
          <div className="flex-1">
            <div className="h-5 bg-gray-300 rounded w-24 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="h-2 bg-gray-200 rounded-full w-16"></div>
        </div>
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5"></div>
        </div>
        <div className="bg-white/60 rounded-lg p-4">
          <div className="h-4 bg-gray-200 rounded w-32 mb-3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/5"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const CitationsSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-pulse">
    <div className="p-6 border-b border-gray-100 bg-gray-50">
      <div className="h-6 bg-gray-300 rounded w-64 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-96"></div>
    </div>
    <div className="divide-y divide-gray-100">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-6">
          <div className="flex items-start justify-between mb-2">
            <div className="h-5 bg-gray-300 rounded w-48"></div>
            <div className="h-5 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="h-16 bg-gray-100 rounded-md mt-3"></div>
        </div>
      ))}
    </div>
  </div>
);

export const ExportSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-4xl mx-auto animate-pulse my-4 min-h-[600px]">
    <div className="bg-gray-100 p-4 border-b">
      <div className="h-5 bg-gray-300 rounded w-32"></div>
    </div>
    <div className="p-12">
      <div className="text-center mb-10">
        <div className="h-8 bg-gray-300 rounded w-64 mx-auto mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-40 mx-auto"></div>
        <div className="h-px bg-gray-300 mt-6"></div>
      </div>
      <div className="space-y-8">
        <div>
          <div className="h-6 bg-gray-300 rounded w-48 mb-3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
        <div>
          <div className="h-6 bg-gray-300 rounded w-40 mb-3"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-5 bg-gray-300 rounded w-56 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

