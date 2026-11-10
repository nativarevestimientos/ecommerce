import React from 'react';

const SkeletonLine = ({ className }: { className: string }) => (
  <div className={`rounded-full bg-[rgb(var(--brand-100))] ${className}`} />
);

export default function ProductSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-[rgb(var(--brand-600)/0.16)] bg-[rgb(var(--surface))] p-3 shadow-sm">
      <div className="flex h-full flex-col">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-[rgb(var(--brand-50))]">
          <div className="absolute left-2 top-2 h-5 w-16 rounded-full bg-[rgb(var(--brand-100))]" />
          <div className="absolute right-2 top-2 h-8 w-8 rounded-full bg-white/80" />
        </div>

        <div className="mt-3 space-y-2">
          <SkeletonLine className="h-3.5 w-[88%]" />
          <SkeletonLine className="h-3.5 w-[72%]" />
          <div className="flex items-center gap-2 pt-1">
            <div className="h-5 w-5 rounded-full bg-[rgb(var(--brand-100))]" />
            <SkeletonLine className="h-3 w-20" />
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <SkeletonLine className="h-3 w-16" />
          <div className="flex items-end gap-2">
            <SkeletonLine className="h-7 w-24" />
            <SkeletonLine className="h-3 w-8" />
            <div className="h-5 w-12 rounded-full bg-[rgb(var(--brand-100))]" />
          </div>
          <SkeletonLine className="h-3 w-24" />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <div className="h-7 w-full rounded-full bg-[rgb(var(--brand-50))]" />
          <div className="h-5 w-28 rounded-full bg-[rgb(var(--brand-100))]" />
        </div>

        <div className="mt-auto pt-4">
          <div className="h-10 w-full rounded-full bg-[rgb(var(--brand-100))]" />
        </div>
      </div>
    </div>
  );
}
