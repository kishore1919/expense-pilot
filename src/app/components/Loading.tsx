'use client';

import React from 'react';

const Loading = () => {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="surface-card flex flex-col items-center gap-5 px-10 py-8">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-4 border-teal-100" />
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-teal-700 animate-spin"
            style={{ animationDuration: '1s' }}
          />
          <div
            className="absolute inset-2 rounded-full border-4 border-transparent border-b-amber-600 animate-spin"
            style={{ animationDuration: '1.6s', animationDirection: 'reverse' }}
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-base font-semibold text-slate-700">Loading your workspace</span>
          <div className="flex gap-1">
            <div className="h-2 w-2 rounded-full bg-teal-700 animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="h-2 w-2 rounded-full bg-teal-700 animate-pulse" style={{ animationDelay: '180ms' }} />
            <div className="h-2 w-2 rounded-full bg-teal-700 animate-pulse" style={{ animationDelay: '360ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
