import React from 'react';

const SkeletonBar = ({ className }: { className: string }) => (
  <div className={`rounded-full bg-[rgb(var(--brand-100))] ${className}`} />
);

const FilterCardSkeleton = ({
  titleWidth,
  rows,
}: {
  titleWidth: string;
  rows: string[];
}) => (
  <div className="rounded-lg border border-gray-100 bg-white p-4">
    <div className="flex items-center justify-between">
      <SkeletonBar className={`h-4 ${titleWidth}`} />
      <div className="h-4 w-4 rounded-full bg-[rgb(var(--brand-100))]" />
    </div>
    <div className="mt-3 space-y-2">
      {rows.map((width, index) => (
        <div
          key={`${width}-${index}`}
          className="flex items-center justify-between rounded-lg px-3 py-2"
        >
          <SkeletonBar className={`h-3.5 ${width}`} />
          <div className="h-4 w-4 rounded-full bg-[rgb(var(--brand-50))]" />
        </div>
      ))}
    </div>
  </div>
);

const FiltersSkeleton = () => {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-dashed border-[rgb(var(--brand-100))] bg-[rgb(var(--brand-50))] px-3 py-2.5">
        <SkeletonBar className="h-3.5 w-24" />
        <SkeletonBar className="h-3.5 w-16" />
      </div>

      <FilterCardSkeleton
        titleWidth="w-24"
        rows={["w-28", "w-32", "w-24", "w-20", "w-24"]}
      />

      <FilterCardSkeleton
        titleWidth="w-36"
        rows={["w-36", "w-28", "w-32", "w-24"]}
      />

      <FilterCardSkeleton
        titleWidth="w-28"
        rows={["w-20", "w-24", "w-16"]}
      />

      <FilterCardSkeleton
        titleWidth="w-24"
        rows={["w-24", "w-20", "w-28", "w-24"]}
      />
    </div>
  );
};

export default FiltersSkeleton;
