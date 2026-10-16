import React from 'react';

// Reusable Base Skeleton Element
export const Skeleton = ({ className = '', rounded = 'rounded-xl', ...props }) => {
  return (
    <div
      className={`skeleton-shimmer ${rounded} ${className}`}
      {...props}
    />
  );
};

// Tool Card Skeleton Placeholder
export const ToolCardSkeleton = () => {
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#dadce0] shadow-2xs flex flex-col justify-between h-[160px] animate-pulse">
      <div>
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="w-10 h-10" rounded="rounded-xl" />
          <Skeleton className="w-14 h-5" rounded="rounded-full" />
        </div>
        <Skeleton className="w-3/4 h-4 mb-2" rounded="rounded" />
        <Skeleton className="w-full h-3 mb-1" rounded="rounded" />
        <Skeleton className="w-2/3 h-3" rounded="rounded" />
      </div>
      <div className="pt-2 border-t border-[#f1f3f4] flex justify-between items-center">
        <Skeleton className="w-20 h-3" rounded="rounded" />
        <Skeleton className="w-4 h-4" rounded="rounded-full" />
      </div>
    </div>
  );
};

// Grid of Tool Cards Skeleton
export const ToolGridSkeleton = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <ToolCardSkeleton key={i} />
      ))}
    </div>
  );
};

// Page Header Skeleton Placeholder
export const PageHeaderSkeleton = () => {
  return (
    <div className="w-full mb-6 p-5 rounded-2xl bg-white border border-[#dadce0] shadow-2xs animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-32 h-4" rounded="rounded-md" />
        <Skeleton className="w-24 h-6" rounded="rounded-full" />
      </div>
      <div className="flex items-start sm:items-center gap-4">
        <Skeleton className="w-12 h-12" rounded="rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-1/3 h-6" rounded="rounded-md" />
          <Skeleton className="w-2/3 h-4" rounded="rounded-md" />
        </div>
      </div>
    </div>
  );
};

// Full Tool Page Workspace Skeleton
export const ToolWorkspaceSkeleton = () => {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-pulse">
      <PageHeaderSkeleton />
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-h-[380px] p-8 rounded-2xl bg-white border border-[#dadce0] shadow-2xs flex flex-col items-center justify-center space-y-4">
          <Skeleton className="w-20 h-20" rounded="rounded-3xl" />
          <Skeleton className="w-56 h-6" rounded="rounded-lg" />
          <Skeleton className="w-80 h-4" rounded="rounded-md" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="w-24 h-6" rounded="rounded-full" />
            <Skeleton className="w-28 h-6" rounded="rounded-full" />
          </div>
        </div>
        <div className="w-full lg:w-[360px] p-6 rounded-2xl bg-white border border-[#dadce0] shadow-2xs space-y-4">
          <Skeleton className="w-32 h-4" rounded="rounded" />
          <Skeleton className="w-full h-10" rounded="rounded-xl" />
          <Skeleton className="w-full h-24" rounded="rounded-xl" />
          <Skeleton className="w-full h-11" rounded="rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default {
  Skeleton,
  ToolCardSkeleton,
  ToolGridSkeleton,
  PageHeaderSkeleton,
  ToolWorkspaceSkeleton
};
